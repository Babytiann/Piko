import { Hono } from 'hono';
import { Api } from 'telegram';
import { getPooledClient } from '../../../lib/telegram/index.js';

export const dialogsRoutes = new Hono();

dialogsRoutes.post('/get-dialogs/v1', async (c) => {
  try {
    const {
      session,
      limit = 30,
      offsetDate,
    } = (await c.req.json()) as {
      session: string;
      limit?: number;
      offsetDate?: number;
    };

    if (!session) {
      console.warn('[piko] 400', c.req.path, 'session is required');
      return c.json({ success: false, error: 'session is required' }, 400);
    }

    const client = await getPooledClient(session);
    const dialogs = await client.getDialogs({ limit, offsetDate });

    const formattedDialogs = dialogs.map((dialog) => {
      const entity = dialog.entity;
      let title = dialog.title ?? 'Unknown';
      let type: 'user' | 'group' | 'channel' = 'user';
      let username = '';
      let accessHash = '';

      if (entity instanceof Api.User) {
        title =
          [entity.firstName, entity.lastName].filter(Boolean).join(' ') ||
          'Unknown';
        username = entity.username ?? '';
        type = 'user';
        accessHash = entity.accessHash?.toString() ?? '';
      } else if (entity instanceof Api.Chat) {
        title = entity.title;
        type = 'group';
      } else if (entity instanceof Api.Channel) {
        title = entity.title;
        username = entity.username ?? '';
        type = entity.megagroup ? 'group' : 'channel';
        accessHash = entity.accessHash?.toString() ?? '';
      }

      let lastMessage = '';
      let lastMessageDate: number | null = null;
      const msg = dialog.message;
      if (msg) {
        lastMessage = msg.message ?? '';
        lastMessageDate = msg.date ?? null;
      }

      return {
        id: dialog.id?.toString(),
        title,
        type,
        username,
        access_hash: accessHash,
        unread_count: dialog.unreadCount,
        last_message: lastMessage,
        last_message_date: lastMessageDate,
        pinned: dialog.pinned,
      };
    });

    return c.json({ success: true, dialogs: formattedDialogs });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get dialogs';
    console.error('get-dialogs error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
