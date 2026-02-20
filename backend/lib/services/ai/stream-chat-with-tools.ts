/**
 * [模块 2] 带 Tool Calling 的聊天 —— ReAct 循环（真流式输出）。
 *
 * 和 streamChat 的区别：
 * - streamChat: AI 直接回答，一轮就结束
 * - streamChatWithTools: AI 可能要调用工具，多轮交互后才回答
 *
 * 返回的是最终回答的真实流式结果，中间的工具调用通过 callbacks 回传。
 *
 * 流式策略：
 *   每一步都用 sendMessageStream，通过 peek 第一个 chunk 判断响应类型：
 *   - 包含 functionCall → 收集完整响应，执行工具，继续循环
 *   - 包含 text → 把真实 stream 直接返回（peeked chunk 拼回去）
 */

import type {
  Content,
  EnhancedGenerateContentResponse,
  GenerateContentStreamResult,
  Part,
} from '@google/generative-ai';
import type { ChatMessage } from '@/types/ai';

import { toolRegistry } from '../ai-tools';
import { getGeminiClient, DEFAULT_MODEL, SYSTEM_INSTRUCTION } from './client';
import { prependChunkToStream, createStreamFromText } from './stream-utils';
import type { ToolCallbacks } from './types';
import { getToolStatusMessage } from './types';

// 注册所有工具 —— import 时会自动执行 register()
import '../tools/get-weather';
import '../tools/plan-route';

/** ReAct 循环最大步数 —— 防止无限循环 */
const MAX_REACT_STEPS = 5;

export async function streamChatWithTools(
  messages: ChatMessage[],
  callbacks: ToolCallbacks,
): Promise<GenerateContentStreamResult> {
  const client = getGeminiClient();

  // 把工具定义传给模型 —— 告诉 AI "你有这些超能力"
  const tools = toolRegistry.getToolDeclarations();

  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    systemInstruction: SYSTEM_INSTRUCTION,
    tools,
  });

  // 构建对话历史（和模块 1 一样）
  const history: Content[] = messages.slice(0, -1).map((m) => ({
    role: m.role,
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1];
  if (!lastMessage || lastMessage.role !== 'user') {
    throw new Error('Last message must be from user');
  }

  const chat = model.startChat({ history });

  // ── ReAct 循环（全流式）─────────────────────────────────────────────
  //
  // 每一步都用 sendMessageStream：
  //   1. peek 第一个 chunk，检查是否有 functionCall
  //   2. 如果有 tool call → 收集完整响应 → 执行工具 → 继续循环
  //   3. 如果是纯文本 → 返回真实流（把 peek 过的 chunk 拼回去）
  //
  // 这样最终回答能真正边生成边推送，用户在几秒内就能看到文字。

  let currentMessage: string | Part[] = lastMessage.content;

  console.log(`[AI] 开始 (最多 ${MAX_REACT_STEPS} 步)`);

  for (let step = 0; step < MAX_REACT_STEPS; step++) {
    const tStep = Date.now();
    console.log(`[AI]   ── Step ${step + 1} ── 发送消息给 Gemini`);

    const streamResult = await chat.sendMessageStream(currentMessage);

    // ── Peek 第一个 chunk ──────────────────────────────────────────
    const iterator = streamResult.stream[Symbol.asyncIterator]();
    const first = await iterator.next();

    if (first.done) {
      throw new Error('Gemini 返回空流');
    }

    const firstChunk = first.value as EnhancedGenerateContentResponse;

    // 检查第一个 chunk 是否包含 functionCall
    const firstParts = firstChunk.candidates?.[0]?.content?.parts ?? [];
    const hasFunctionCall = firstParts.some((p) => 'functionCall' in p);

    if (hasFunctionCall) {
      // ── Tool call 路径：收集完整响应 ────────────────────────────
      // 需要完整的 parts 来拿到所有 function call，所以等 response 完成
      const fullResponse = await streamResult.response;
      const candidate = fullResponse.candidates?.[0];

      if (!candidate) {
        throw new Error('Gemini 返回空结果');
      }

      const functionCalls = candidate.content.parts.filter(
        (
          part,
        ): part is Part & {
          functionCall: { name: string; args: Record<string, unknown> };
        } => 'functionCall' in part,
      );

      console.log(
        `[AI]   Step ${step + 1}: AI 要求调用 ${functionCalls.length} 个工具 (${Date.now() - tStep}ms)`,
      );

      for (const fc of functionCalls) {
        const { name, args } = fc.functionCall;
        console.log(`[AI]   🔧 调用工具: ${name}(${JSON.stringify(args)})`);
        callbacks.onToolStart(name, args, getToolStatusMessage(name));
      }

      const functionResponseParts: Part[] = await Promise.all(
        functionCalls.map(async (fc) => {
          const { name, args } = fc.functionCall;

          const tTool = Date.now();
          const result = await toolRegistry.execute(name, args);
          const elapsed = Date.now() - tTool;

          if (result.success) {
            const dataPreview = JSON.stringify(result.data).slice(0, 200);
            console.log(
              `[AI]   ✓ ${name} 成功 (${elapsed}ms) → ${dataPreview}${JSON.stringify(result.data).length > 200 ? '...' : ''}`,
            );
          } else {
            console.log(
              `[AI]   ✗ ${name} 失败 (${elapsed}ms) → ${result.error}`,
            );
          }

          callbacks.onToolEnd(name, result.success);

          return {
            functionResponse: {
              name,
              response: result.success
                ? { result: result.data }
                : { error: result.error },
            },
          };
        }),
      );

      currentMessage = functionResponseParts;
      console.log(`[AI]   Step ${step + 1} 完成，把工具结果送回 AI...`);
    } else {
      // ── 纯文本路径：返回真实流 ──────────────────────────────────
      //
      // 把 peek 过的第一个 chunk 和剩余的 stream 拼成一个新的
      // GenerateContentStreamResult，直接返回给路由层。
      // 路由层的 for-await 会真正逐块收到 Gemini 边生成边推送的文本。
      console.log(
        `[AI]   Step ${step + 1}: 无工具调用 → 返回真实流 (${Date.now() - tStep}ms)`,
      );

      return prependChunkToStream(firstChunk, iterator, streamResult.response);
    }
  }

  console.log(`[AI]   ⚠ 达到最大步数 (${MAX_REACT_STEPS})，强制结束`);
  return createStreamFromText('抱歉，处理过程过于复杂，请尝试简化你的问题。');
}
