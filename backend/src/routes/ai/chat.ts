import { Hono } from 'hono';
import { type ModelMessage } from 'ai';

import { getUserId, UnauthorizedError } from '../../../lib/auth.js';
import { streamChatWithTools } from '../../../lib/services/ai/stream-chat-with-tools.js';
import {
  createConversation,
  saveUserMessage,
  saveModelMessage,
  autoTitle,
} from '../../../lib/services/ai/conversation/index.js';
import type { AiChatRequest } from '../../../types/ai.js';

export const chatRoutes = new Hono();

chatRoutes.post('/chat/v1', async (c) => {
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

  const conversationId = body.conversation_id ?? null;
  const requestId = body.request_id?.trim() || null;
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

  const modelMessages: ModelMessage[] = body.messages.map((m) => ({
    role: m.role === 'model' ? 'assistant' : 'user',
    content: m.content,
  }));

  let savedConversationId: string | null = isNewConversation
    ? null
    : (conversationId ?? null);

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
        writeData({
          type: 'conversation',
          conversation_id: savedConversationId,
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
