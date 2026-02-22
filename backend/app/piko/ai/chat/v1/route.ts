import { NextRequest } from 'next/server';
import { streamChatWithTools } from '@/lib/services/ai';
import { createLocationRequest } from '@/lib/services/location-bridge';
import { getUserId } from '@/lib/auth';
import {
  createConversation,
  saveUserMessage,
  saveModelMessage,
  autoTitle,
} from '@/lib/services/ai/conversation';
import type { AiChatRequest, SseEvent } from '@/types/ai';

/**
 * POST /piko/ai/chat/v1
 *
 * [模块 1] 基础：接收对话历史，返回 SSE 流式响应。
 * [模块 2] 升级：支持 Tool Calling，新增 tool_start / tool_end 事件。
 * [模块 3] 升级：支持前端协作式工具（get_user_location），新增 request_location 事件。
 *
 * SSE 事件类型:
 *   - chunk:            文本片段（打字效果）
 *   - tool_start:       Agent 开始调用工具（前端显示"正在查询..."）
 *   - tool_end:         工具调用结束
 *   - request_location: 请求前端获取用户位置
 *   - done:             整个响应完成
 *   - error:            出错
 */
export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const fallbackErrorReply = '抱歉，刚刚生成回答时出错了，请重试。';
  const userId = getUserId(request);

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

  // conversationId: "new" = 新建对话，已有值 = 追加到现有对话
  const conversationId = body.conversationId ?? null;
  const requestId = body.requestId?.trim() || null;
  const isNewConversation = !conversationId || conversationId === 'new';

  const toMessageId = (
    reqId: string | null,
    suffix: 'user' | 'model',
  ): string | undefined => {
    if (!reqId) return undefined;
    const normalized = reqId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80);
    return `ai_${normalized}_${suffix}`;
  };

  const userMessageId = toMessageId(requestId, 'user');
  const modelMessageId = toMessageId(requestId, 'model');

  const msgCount = body.messages.length;
  const userText = lastMsg.content.slice(0, 80);
  console.log(
    `[AI] ← 收到请求 (req=${requestId ?? '-'}, ${msgCount} 条历史, conv=${conversationId ?? 'new'}) "${userText}${lastMsg.content.length > 80 ? '...' : ''}"`,
  );

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let clientDisconnected = false;
      let chunkCount = 0;
      let savedConversationId: string | null = conversationId;

      const onAbort = () => {
        clientDisconnected = true;
        closed = true;
        console.log(
          `[AI] 客户端连接已断开 (req=${requestId ?? '-'}, conv=${savedConversationId ?? 'new'})，停止 SSE 推送，继续后台生成并落库`,
        );
      };

      request.signal.addEventListener('abort', onAbort);

      const enqueue = (event: SseEvent) => {
        if (closed || clientDisconnected) return;
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
        if (isNewConversation) {
          const conv = await createConversation(userId);
          savedConversationId = conv.id;
          await autoTitle(conv.id, lastMsg.content);
          console.log(
            `[AI] 已创建会话 (req=${requestId ?? '-'}, conv=${savedConversationId})`,
          );
        }

        if (savedConversationId && savedConversationId !== 'new') {
          enqueue({
            type: 'conversation',
            conversationId: savedConversationId,
          });
          await saveUserMessage(
            savedConversationId,
            lastMsg.content,
            userMessageId,
          );
          console.log(
            `[AI] 用户消息已入库 (req=${requestId ?? '-'}, conv=${savedConversationId}, msg=${userMessageId ?? '-'})`,
          );
        }

        const tReact = Date.now();
        const result = await streamChatWithTools(body.messages, {
          onToolStart(tool, args, message) {
            enqueue({ type: 'tool_start', tool, args, message });
          },
          onToolEnd(tool, success) {
            enqueue({ type: 'tool_end', tool, success });
          },
          async onRequestLocation() {
            // 创建位置请求，通过 SSE 通知前端
            const { requestId, promise } = createLocationRequest();
            enqueue({ type: 'request_location', requestId });
            // 等待前端通过 POST /piko/ai/location/v1 回传位置
            return promise;
          },
        });
        console.log(
          `[AI]   ReAct 循环完成 (+${Date.now() - tReact}ms)，开始流式输出`,
        );

        let fullModelResponse = '';
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) {
            chunkCount++;
            fullModelResponse += text;
            enqueue({ type: 'chunk', content: text });
          }
        }

        if (savedConversationId && savedConversationId !== 'new') {
          await saveModelMessage(
            savedConversationId,
            fullModelResponse,
            undefined,
            modelMessageId,
          );
          console.log(
            `[AI] 模型消息已入库 (req=${requestId ?? '-'}, conv=${savedConversationId}, msg=${modelMessageId ?? '-'})`,
          );
        }

        enqueue({
          type: 'done',
          ...(savedConversationId &&
            savedConversationId !== 'new' && {
              conversationId: savedConversationId,
            }),
        });
        console.log(
          `[AI] → 完成 (req=${requestId ?? '-'}, ${chunkCount} chunks, conv=${savedConversationId}, 总耗时 ${Date.now() - t0}ms)`,
        );
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : 'AI service unavailable';
        console.error(
          `[AI] ✗ 错误 (req=${requestId ?? '-'}, conv=${savedConversationId ?? 'new'}, ${Date.now() - t0}ms):`,
          err,
        );

        if (savedConversationId && savedConversationId !== 'new') {
          try {
            await saveModelMessage(
              savedConversationId,
              fallbackErrorReply,
              undefined,
              modelMessageId,
            );
          } catch (persistErr) {
            console.error(
              `[AI] 错误占位消息持久化失败 (req=${requestId ?? '-'}, conv=${savedConversationId}):`,
              persistErr,
            );
          }
        }

        enqueue({ type: 'error', message });
      } finally {
        request.signal.removeEventListener('abort', onAbort);
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
