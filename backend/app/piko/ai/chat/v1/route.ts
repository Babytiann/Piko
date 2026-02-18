import { NextRequest } from 'next/server';
import { streamChatWithTools } from '@/lib/services/ai';
import type { AiChatRequest, SseEvent } from '@/types/ai';

/**
 * POST /piko/ai/chat/v1
 *
 * [模块 1] 基础：接收对话历史，返回 SSE 流式响应。
 * [模块 2] 升级：支持 Tool Calling，新增 tool_start / tool_end 事件。
 *
 * SSE 事件类型:
 *   - chunk:      文本片段（打字效果）
 *   - tool_start: Agent 开始调用工具（前端显示"正在查询..."）
 *   - tool_end:   工具调用结束
 *   - done:       整个响应完成
 *   - error:      出错
 */
export async function POST(request: NextRequest) {
  const t0 = Date.now();

  let body: AiChatRequest;
  try {
    body = (await request.json()) as AiChatRequest;
  } catch {
    return errorResponse('Invalid JSON body', 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return errorResponse('messages must be a non-empty array', 400);
  }

  const lastMsg = body.messages[body.messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.trim()) {
    return errorResponse('Last message must be a non-empty user message', 400);
  }

  const msgCount = body.messages.length;
  const userText = lastMsg.content.slice(0, 80);
  console.log(
    `[AI] ← 收到请求 (${msgCount} 条历史) "${userText}${lastMsg.content.length > 80 ? '...' : ''}"`,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let chunkCount = 0;

      const enqueue = (event: SseEvent) => {
        if (closed) return;
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
          );
        } catch {
          closed = true;
        }
      };

      const close = () => {
        if (closed) return;
        closed = true;
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      try {
        const tReact = Date.now();
        const result = await streamChatWithTools(body.messages, {
          onToolStart(tool, args, message) {
            enqueue({ type: 'tool_start', tool, args, message });
          },
          onToolEnd(tool, success) {
            enqueue({ type: 'tool_end', tool, success });
          },
        });
        console.log(
          `[AI]   ReAct 循环完成 (+${Date.now() - tReact}ms)，开始流式输出`,
        );

        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            chunkCount++;
            enqueue({ type: 'chunk', content: text });
          }
        }

        enqueue({ type: 'done' });
        console.log(
          `[AI] → 完成 (${chunkCount} chunks, 总耗时 ${Date.now() - t0}ms)`,
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'AI service unavailable';
        console.error(`[AI] ✗ 错误 (${Date.now() - t0}ms):`, err);
        enqueue({ type: 'error', message });
      } finally {
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

// ── Helpers ─────────────────────────────────────────────────────────────

function errorResponse(message: string, status: number): Response {
  return Response.json({ success: false, error: message }, { status });
}
