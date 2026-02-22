/**
 * streamChatWithTools — Vercel AI SDK 版多步骤 Agent 流式对话。
 *
 * 核心流程：
 *   1. 接收对话历史（CoreMessage[]），通过 streamText 发起多步推理
 *   2. 工具调用（weather / plan_route / get_user_location 等）由 Vercel AI SDK 自动处理
 *   3. get_user_location 等前端协作式工具通过 context.writeData 向数据流写
 *      request_location 事件，由前端 GPS 采集后 POST 回来
 *   4. 返回 Response（Vercel AI SDK Data Stream 协议）给 Hono 路由层
 */

import {
  streamText,
  createDataStreamResponse,
  type CoreMessage,
  type DataStreamWriter,
  type JSONValue,
} from 'ai';
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
   * 流开始前的钩子 — 路由层用于：
   * 1. 创建新会话、写 conversationId 数据部分
   * 2. 保存用户消息到 DB
   */
  setup?: (dataStream: DataStreamWriter) => Promise<void>;
  /** 流完成后的回调，用于保存 AI 消息到 DB */
  onFinish?: (result: { text: string }) => Promise<void>;
}

// ---------------------------------------------------------------------------
// 主函数
// ---------------------------------------------------------------------------

/**
 * 启动流式对话，返回标准 Web Response（Vercel AI SDK Data Stream 格式）。
 * Hono 路由层直接 `return streamChatWithTools(messages)` 即可。
 */
export function streamChatWithTools(
  messages: CoreMessage[],
  options: StreamChatOptions = {},
): Response {
  const { setup, onFinish } = options;

  return createDataStreamResponse({
    execute: async (dataStream) => {
      // 路由层的预处理（建会话、保存用户消息等）
      if (setup) {
        await setup(dataStream);
      }

      const result = streamText({
        model: getModel(),
        system: SYSTEM_INSTRUCTION,
        messages,
        // 注入 ToolContext.writeData，前端协作式工具需要
        tools: toolRegistry.getToolsForAI({
          writeData: (d) => dataStream.writeData(d as JSONValue),
        }),
        // 最多 10 步自主推理（避免死循环）
        maxSteps: 10,

        // ── 工具调用开始时发 tool_start 事件 ──────────────────────────
        onChunk: ({ chunk }) => {
          if (chunk.type === 'tool-call') {
            dataStream.writeData({
              type: 'tool_start',
              tool: chunk.toolName,
              message: getToolStatusMessage(chunk.toolName),
            });
          }
        },

        // ── 每步完成时发 tool_end 事件 ────────────────────────────────
        onStepFinish: async ({ toolResults }) => {
          for (const tr of toolResults as Array<{
            toolName: string;
            isError: boolean;
          }>) {
            dataStream.writeData({
              type: 'tool_end',
              tool: tr.toolName,
              success: !tr.isError,
            });
          }
        },

        // ── 全部步骤完成后回调（用于 DB 持久化）─────────────────────
        onFinish: async ({ text }) => {
          if (onFinish) {
            await onFinish({ text });
          }
        },
      });

      // 把 streamText 产出的文本/工具事件合并进 dataStream
      result.mergeIntoDataStream(dataStream);
    },

    onError: (error) => {
      console.error('[streamChatWithTools] 流式对话异常:', error);
      return '抱歉，AI 服务暂时不可用，请稍后再试。';
    },
  });
}
