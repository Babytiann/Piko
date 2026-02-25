/**
 * streamChatWithTools — Vercel AI SDK v6 版多步骤 Agent 流式对话。
 *
 * 核心流程：
 *   1. 接收对话历史（ModelMessage[]），通过 streamText 发起多步推理
 *   2. 工具调用（weather / plan_route / get_user_location 等）由 Vercel AI SDK 自动处理
 *   3. get_user_location 等前端协作式工具通过 context.writeData 向数据流写
 *      request_location 事件，由前端 GPS 采集后 POST 回来
 *   4. 对外保持 v4 Data Stream 协议格式（0/2/d/3），无需修改前端解析器
 *
 * 升级说明（v4 → v6）：
 *   - CoreMessage      → ModelMessage
 *   - createDataStreamResponse → 自建 ReadableStream，手动输出 v4 格式
 *   - maxSteps         → stopWhen: stepCountIs(N)
 *   - tool.parameters  → tool.inputSchema
 *   - thought_signature 由 @ai-sdk/google@3.x 自动透传
 */

import { streamText, stepCountIs, type ModelMessage } from 'ai';
import { getModel, SYSTEM_INSTRUCTION } from './client';
import { toolRegistry } from '../ai-tools';
import { getToolStatusMessage } from './types';

// 确保工具在模块加载时注册（副作用 import）
import '../tools/get-weather';
import '../tools/plan-route';
import '../tools/get-user-location';

// ---------------------------------------------------------------------------
// 类型
// ---------------------------------------------------------------------------

export interface StreamChatOptions {
  /**
   * 客户端断开时中止生成；onFinish 仅在未中止时执行，避免覆盖前端的「回答中断」持久化。
   */
  abortSignal?: AbortSignal;
  /**
   * 流开始前的钩子 — 路由层用于：
   * 1. 创建新会话、写 conversationId 数据部分
   * 2. 保存用户消息到 DB
   *
   * 入参 writeData 用于向数据流写入自定义 data 块（v4 协议 type=2）。
   */
  setup?: (writeData: (data: unknown) => void) => Promise<void>;
  /** 流完成后的回调，用于保存 AI 消息到 DB（客户端已断开时不执行） */
  onFinish?: (result: { text: string }) => Promise<void>;
}

// ---------------------------------------------------------------------------
// 主函数
// ---------------------------------------------------------------------------

/**
 * 启动流式对话，返回标准 Web Response。
 * 输出格式保持 Vercel AI SDK v4 Data Stream 协议（0/2/d/3），前端无需改动。
 */
export function streamChatWithTools(
  messages: ModelMessage[],
  options: StreamChatOptions = {},
): Response {
  const { abortSignal, setup, onFinish } = options;
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      const enqueue = (line: string): void => {
        controller.enqueue(encoder.encode(line));
      };

      /** v4 协议: 0:"text chunk" */
      const writeText = (text: string): void =>
        enqueue(`0:${JSON.stringify(text)}\n`);

      /** v4 协议: 2:[{...}] — 自定义 data */
      const writeData = (data: unknown): void =>
        enqueue(`2:${JSON.stringify([data])}\n`);

      /** v4 协议: d:{finishReason,...} — 流结束 */
      const writeFinish = (finishReason: string): void =>
        enqueue(`d:${JSON.stringify({ finishReason })}\n`);

      /** v4 协议: 3:"error message" */
      const writeError = (msg: string): void =>
        enqueue(`3:${JSON.stringify(msg)}\n`);

      try {
        // 路由层预处理（建会话、保存用户消息等）
        if (setup) {
          await setup(writeData);
        }

        const result = streamText({
          model: getModel(),
          system: SYSTEM_INSTRUCTION,
          messages,
          tools: toolRegistry.getToolsForAI({ writeData }),
          stopWhen: stepCountIs(10),
          temperature: 0,
          ...(abortSignal && { abortSignal }),
          onFinish: async ({ text }) => {
            if (abortSignal?.aborted) {
              console.log(
                '[streamChatWithTools] 客户端已断开，跳过 onFinish 保存',
              );
              return;
            }
            if (onFinish) await onFinish({ text });
          },
        });

        // 迭代 fullStream，按 v4 协议格式逐行输出；客户端断开则退出
        for await (const chunk of result.fullStream) {
          if (abortSignal?.aborted) break;
          switch (chunk.type) {
            case 'text-delta':
              // v6 fullStream: text-delta chunk 用 chunk.text
              writeText(chunk.text);
              break;

            case 'tool-call':
              // 工具开始执行 → 发 tool_start 事件
              writeData({
                type: 'tool_start',
                tool: chunk.toolName,
                message: getToolStatusMessage(chunk.toolName),
              });
              break;

            case 'tool-result':
              // 工具执行成功 → 发 tool_end 事件
              writeData({
                type: 'tool_end',
                tool: chunk.toolName,
                success: true,
              });
              break;

            case 'finish':
              writeFinish(chunk.finishReason);
              break;

            // 其余类型（text-start/text-end、tool-input-*、reasoning-* 等）忽略
            default:
              break;
          }
        }
      } catch (error) {
        console.error('[streamChatWithTools] 流式对话异常:', error);
        writeError('抱歉，AI 服务暂时不可用，请稍后再试。');
        writeFinish('error');
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'X-Vercel-AI-Data-Stream': 'v1',
      'Cache-Control': 'no-cache',
    },
  });
}
