/**
 * Chat (Telegram 聊天) 路由
 *   POST /piko/chat/list/v1
 *   POST /piko/chat/detail/v1
 */

import { Hono } from 'hono';
import {
  getChatListPageData,
  getChatDetailPageData,
} from '@/lib/services/chat';

export const chatRoutes = new Hono();

// ── POST /list/v1 ────────────────────────────────────────────────────────────
chatRoutes.post('/list/v1', async (c) => {
  try {
    const { session } = (await c.req.json()) as { session?: string };
    const data = await getChatListPageData(session || undefined);
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load chat list';
    console.error('chat/list error:', err);

    if (message.includes('AUTH_KEY_UNREGISTERED')) {
      return c.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          errorCode: 'AUTH_EXPIRED',
        },
        401,
      );
    }

    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /detail/v1 ──────────────────────────────────────────────────────────
chatRoutes.post('/detail/v1', async (c) => {
  try {
    const { session, chatId, chatType, accessHash, title, offsetId } =
      (await c.req.json()) as {
        session: string;
        chatId: string;
        chatType: string;
        accessHash: string;
        title: string;
        offsetId?: number;
      };

    if (!session || !chatId) {
      return c.json(
        { success: false, error: 'session and chatId are required' },
        400,
      );
    }

    const data = await getChatDetailPageData(
      session,
      chatId,
      chatType ?? 'user',
      accessHash ?? '',
      title ?? 'Chat',
      50,
      offsetId,
    );
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load chat detail';
    console.error('chat/detail error:', err);

    if (message.includes('AUTH_KEY_UNREGISTERED')) {
      return c.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          errorCode: 'AUTH_EXPIRED',
        },
        401,
      );
    }

    return c.json({ success: false, error: message }, 500);
  }
});
