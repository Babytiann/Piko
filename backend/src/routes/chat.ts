import { Hono } from 'hono';
import {
  getChatListPageData,
  getChatDetailPageData,
} from '../../lib/services/chat/index.js';
import {
  unbindTelegram,
  getTelegramSession,
} from '../../lib/services/user/index.js';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';

export const chatRoutes = new Hono();

// ── POST /list/v1 ────────────────────────────────────────────────────────────
chatRoutes.post('/list/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);

    // 从请求体获取前端传递的 session（可选）
    let bodySession: string | undefined;

    const body = (await c.req.json()) as { session?: string };
    bodySession = body.session || undefined;

    // 优先使用数据库中的 session，fallback 到前端传递的 session
    const dbSession = await getTelegramSession(userId);
    const session = dbSession ?? bodySession ?? undefined;

    const data = await getChatListPageData(session);
    return c.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to load chat list';
    console.error('chat/list error:', err);

    if (
      message.includes('AUTH_KEY_UNREGISTERED') ||
      message.includes('AUTH_BYTES_INVALID')
    ) {
      const userId = await getUserId(c.req.raw);
      void unbindTelegram(userId).catch((e) => {
        console.error('chat/list unbind error:', e);
      });
      return c.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          error_code: 'AUTH_EXPIRED',
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
    const userId = await getUserId(c.req.raw);

    const body = (await c.req.json()) as {
      session?: string;
      chat_id: string;
      chat_type?: string;
      access_hash?: string;
      title?: string;
      offset_id?: number;
    };

    // 优先使用数据库中的 session，fallback 到前端传递的 session
    const dbSession = await getTelegramSession(userId);
    const session = dbSession ?? body.session ?? undefined;
    const chatId = body.chat_id;
    const chatType = body.chat_type ?? 'user';
    const accessHash = body.access_hash ?? '';
    const title = body.title ?? 'Chat';
    const offsetId = body.offset_id;

    if (!session || !chatId) {
      return c.json(
        { success: false, error: 'session and chat_id are required' },
        400,
      );
    }

    const data = await getChatDetailPageData(
      session,
      chatId,
      chatType,
      accessHash,
      title,
      50,
      offsetId,
    );
    return c.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to load chat detail';
    console.error('chat/detail error:', err);

    if (
      message.includes('AUTH_KEY_UNREGISTERED') ||
      message.includes('AUTH_BYTES_INVALID')
    ) {
      try {
        const uid = await getUserId(c.req.raw);
        void unbindTelegram(uid).catch((e) => {
          console.error('chat/detail unbind error:', e);
        });
      } catch {
        // ignore
      }
      return c.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          error_code: 'AUTH_EXPIRED',
        },
        401,
      );
    }

    return c.json({ success: false, error: message }, 500);
  }
});
