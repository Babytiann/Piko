import type {
  Content,
  EnhancedGenerateContentResponse,
  GenerateContentStreamResult,
  Part,
} from '@google/generative-ai';
import type { ChatMessage } from '@/types/ai';

import { toolRegistry } from '../ai-tools';
import { getGeminiClient, DEFAULT_MODEL, SYSTEM_INSTRUCTION } from './client';
import { prependChunkToStream } from './stream-utils';
import type { ToolCallbacks } from './types';
import { getToolStatusMessage } from './types';

import '../tools/get-weather';
import '../tools/plan-route';
import '../tools/get-user-location';

const FRONTEND_COLLABORATIVE_TOOLS = new Set(['get_user_location']);

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

  let currentMessage: string | Part[] = lastMessage.content;
  let step = 0;

  console.log('[AI] 开始 (无步数上限)');

  while (true) {
    step += 1;
    const tStep = Date.now();
    console.log(`[AI]   ── Step ${step} ── 发送消息给 Gemini`);

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
        `[AI]   Step ${step}: AI 要求调用 ${functionCalls.length} 个工具 (${Date.now() - tStep}ms)`,
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

          // ── 前端协作式工具：特殊处理 ──────────────────────
          if (FRONTEND_COLLABORATIVE_TOOLS.has(name)) {
            console.log(`[AI]   📍 前端协作工具: ${name}，等待前端回传...`);
            const location = await callbacks.onRequestLocation();
            const elapsed = Date.now() - tTool;

            if (location) {
              console.log(
                `[AI]   ✓ ${name} 成功 (${elapsed}ms) → ${location.latitude},${location.longitude}`,
              );
              callbacks.onToolEnd(name, true);
              return {
                functionResponse: {
                  name,
                  response: { result: location },
                },
              };
            } else {
              console.log(
                `[AI]   ✗ ${name} 失败 (${elapsed}ms) → 用户拒绝提供位置`,
              );
              callbacks.onToolEnd(name, false);
              return {
                functionResponse: {
                  name,
                  response: {
                    error: '用户拒绝提供地理位置权限，无法获取位置信息',
                  },
                },
              };
            }
          }

          // ── 普通工具：直接执行 ────────────────────────────
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
      console.log(`[AI]   Step ${step} 完成，把工具结果送回 AI...`);
    } else {
      console.log(
        `[AI]   Step ${step}: 无工具调用 → 返回真实流 (${Date.now() - tStep}ms)`,
      );
      return prependChunkToStream(firstChunk, iterator, new Promise(() => {}));
    }
  }
}
