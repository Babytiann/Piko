/**
 * AI 路由 — Hono + Vercel AI SDK 版
 *
 *   POST /piko/ai/chat/v1                   — 流式多步 Agent 对话（Vercel AI SDK Data Stream）
 *   POST /piko/ai/location/v1              — 前端回传位置（配合 get_user_location 工具）
 *   POST /piko/ai/recognize/v1             — Gemini Vision 识别消费信息
 *   POST /piko/ai/copywriting/v1           — AI 页文案
 *   POST /piko/ai/conversation/list/v1     — 对话列表
 *   POST /piko/ai/conversation/create/v1   — 创建对话
 *   POST /piko/ai/conversation/detail/v1   — 对话详情
 *   POST /piko/ai/conversation/delete/v1   — 删除对话
 */

import { Hono } from 'hono';
import { type ModelMessage } from 'ai';
import { getUserId, UnauthorizedError } from '@/lib/auth';
import { resolveLocationRequest } from '@/lib/services/location-bridge';
import { recognizePayment } from '@/lib/services/tools/recognize-payment';
import { streamChatWithTools } from '@/lib/services/ai/stream-chat-with-tools';
import {
  createConversation,
  listConversations,
  getConversationWithMessages,
  deleteConversation,
  saveUserMessage,
  saveModelMessage,
  upsertModelMessage,
  autoTitle,
} from '@/lib/services/ai/conversation';
import type { AiChatRequest, AiCopywriting } from '@/types/ai';

export const aiRoutes = new Hono();

// ── POST /chat/v1 ─────────────────────────────────────────────────────────────
// Vercel AI SDK Data Stream 协议。前端需解析 0:text / 2:[data] 格式。
aiRoutes.post('/chat/v1', async (c) => {
  const t0 = Date.now();
  let userId: string;
  try {
    userId = await getUserId(c.req.raw);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    throw e;
  }

  let body: AiChatRequest;
  try {
    body = (await c.req.json()) as AiChatRequest;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json(
      { success: false, error: 'messages must be a non-empty array' },
      400,
    );
  }

  const lastMsg = body.messages[body.messages.length - 1];
  if (!lastMsg || lastMsg.role !== 'user' || !lastMsg.content.trim()) {
    return c.json(
      {
        success: false,
        error: 'Last message must be a non-empty user message',
      },
      400,
    );
  }

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

  // ChatMessage.role 'model' → ModelMessage.role 'assistant'
  const modelMessages: ModelMessage[] = body.messages.map((m) => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.content,
  }));

  // savedConversationId 在 setup/onFinish 两个闭包间共享
  let savedConversationId: string | null = isNewConversation
    ? null
    : (conversationId ?? null);

  // 客户端断开时中止流，避免 onFinish 写入完整回复覆盖前端的「回答中断」
  const abortController = new AbortController();
  const raw = c.req.raw as unknown;
  if (
    raw &&
    typeof (raw as { on?: (e: string, fn: () => void) => void }).on ===
      'function'
  ) {
    const req = raw as { on: (e: string, fn: () => void) => void };
    const onClose = (): void => {
      abortController.abort();
    };
    req.on('close', onClose);
    req.on('aborted', onClose);
  }

  const response = streamChatWithTools(modelMessages, {
    abortSignal: abortController.signal,
    setup: async (writeData) => {
      if (isNewConversation) {
        const conv = await createConversation(userId);
        savedConversationId = conv.id;
        void autoTitle(conv.id, lastMsg.content);
        console.log(
          `[AI] 已创建会话 (req=${requestId ?? '-'}, conv=${savedConversationId})`,
        );
      }

      if (savedConversationId) {
        // 告知前端本次对话的 ID（新建会话时前端需要持久化）
        writeData({
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

      console.log(
        `[AI] 开始流式生成 (req=${requestId ?? '-'}, conv=${savedConversationId})`,
      );
    },

    onFinish: async ({ text }) => {
      if (savedConversationId) {
        await saveModelMessage(
          savedConversationId,
          text,
          undefined,
          modelMessageId,
        );
        console.log(
          `[AI] → 完成 (req=${requestId ?? '-'}, conv=${savedConversationId}, 总耗时 ${Date.now() - t0}ms)`,
        );
      }
    },
  });

  return response;
});

// ── POST /location/v1 ─────────────────────────────────────────────────────────
// 前端 GPS 采集完成后，通过此端点把位置回传给正在等待中的 get_user_location 工具
aiRoutes.post('/location/v1', async (c) => {
  interface LocationResponseBody {
    requestId: string;
    location: { latitude: number; longitude: number } | null;
  }

  let body: LocationResponseBody;
  try {
    body = (await c.req.json()) as LocationResponseBody;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!body.requestId) {
    return c.json({ success: false, error: 'requestId is required' }, 400);
  }

  const resolved = resolveLocationRequest(body.requestId, body.location);

  if (!resolved) {
    return c.json(
      { success: false, error: 'Request not found or timed out' },
      404,
    );
  }

  return c.json({ success: true });
});

// ── POST /recognize/v1 ────────────────────────────────────────────────────────
aiRoutes.post('/recognize/v1', async (c) => {
  const t0 = Date.now();

  interface RecognizeRequest {
    image: string;
    mimeType: string;
  }

  let body: RecognizeRequest;
  try {
    body = (await c.req.json()) as RecognizeRequest;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!body.image || typeof body.image !== 'string') {
    return c.json({ success: false, error: 'image (base64) is required' }, 400);
  }
  if (!body.mimeType || typeof body.mimeType !== 'string') {
    return c.json({ success: false, error: 'mimeType is required' }, 400);
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(body.mimeType)) {
    return c.json(
      {
        success: false,
        error: `Unsupported mimeType. Allowed: ${allowedMimeTypes.join(', ')}`,
      },
      400,
    );
  }

  console.log(
    `[Recognize] ← 收到识别请求 (${body.mimeType}, ${Math.round(body.image.length / 1024)}KB base64)`,
  );

  try {
    const result = await recognizePayment(body.image, body.mimeType);
    const elapsed = Date.now() - t0;
    console.log(
      `[Recognize] ✓ 识别完成 (${elapsed}ms) → ¥${result.amount} ${result.merchant} [${result.category}] 置信度:${result.confidence}`,
    );
    return c.json({ success: true, data: { result } });
  } catch (err: unknown) {
    const elapsed = Date.now() - t0;
    const message =
      err instanceof Error ? err.message : 'Unknown recognition error';
    console.error(`[Recognize] ✗ 识别失败 (${elapsed}ms) →`, message);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /copywriting/v1 ──────────────────────────────────────────────────────
aiRoutes.post('/copywriting/v1', async (c) => {
  const data: AiCopywriting = {
    headerTitle: 'AI 助手',
    emptyTitle: 'Hi，我是 Piko AI',
    emptySubtitle: '问我任何问题，我会尽力帮你解答。',
    inputPlaceholder: '问我任何问题...',
    drawerTitle: '历史对话',
    newChatLabel: '新对话',
  };
  return c.json({ success: true, data });
});

// ── POST /conversation/list/v1 ────────────────────────────────────────────────
aiRoutes.post('/conversation/list/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const conversations = await listConversations(userId);
    return c.json({ success: true, data: conversations });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to list conversations';
    console.error('[Conversation list] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /conversation/create/v1 ──────────────────────────────────────────────
aiRoutes.post('/conversation/create/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { title?: string };
    const conversation = await createConversation(userId, body.title);
    return c.json({
      success: true,
      data: {
        id: conversation.id,
        title: conversation.title,
        createdAt: conversation.createdAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to create conversation';
    console.error('[Conversation create] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /conversation/detail/v1 ──────────────────────────────────────────────
aiRoutes.post('/conversation/detail/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { conversationId: string };

    if (!body.conversationId) {
      return c.json(
        { success: false, error: 'conversationId is required' },
        400,
      );
    }

    const detail = await getConversationWithMessages(
      userId,
      body.conversationId,
    );

    if (!detail) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    return c.json({ success: true, data: detail });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to get conversation detail';
    console.error('[Conversation detail] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /conversation/save-interrupted/v1 ────────────────────────────────────
aiRoutes.post('/conversation/save-interrupted/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as {
      conversationId: string;
      messageId: string;
      content: string;
    };

    if (!body.conversationId || !body.messageId) {
      return c.json(
        { success: false, error: 'conversationId and messageId are required' },
        400,
      );
    }

    await upsertModelMessage(body.conversationId, body.messageId, body.content);

    console.log(
      `[Conversation save-interrupted] done (user=${userId}, conversation=${body.conversationId}, message=${body.messageId})`,
    );

    return c.json({ success: true });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to save interrupted message';
    console.error('[Conversation save-interrupted] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /conversation/delete/v1 ──────────────────────────────────────────────
aiRoutes.post('/conversation/delete/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as { conversationId: string };

    if (!body.conversationId) {
      return c.json(
        { success: false, error: 'conversationId is required' },
        400,
      );
    }

    const { conversationId } = body;
    console.log(
      `[Conversation delete] accepted (user=${userId}, conversation=${conversationId})`,
    );

    const deleted = await deleteConversation(userId, conversationId);
    console.log(
      `[Conversation delete] done (user=${userId}, conversation=${conversationId}, deleted=${deleted})`,
    );

    return c.json({ success: true, data: { deleted } });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to delete conversation';
    console.error('[Conversation delete] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
