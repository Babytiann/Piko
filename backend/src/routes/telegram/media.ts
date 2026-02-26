import { Hono } from 'hono';
import {
  downloadMessageMedia,
  downloadPeerPhoto,
} from '@/lib/services/telegram';

export const mediaRoutes = new Hono();

mediaRoutes.get('/media/v1', async (c) => {
  try {
    const session = c.req.query('session');
    const chatId = c.req.query('chatId');
    const chatType = c.req.query('chatType') ?? 'user';
    const accessHash = c.req.query('accessHash') ?? '';
    const messageId = Number(c.req.query('messageId'));

    if (!session || !chatId || !messageId) {
      return c.json(
        {
          success: false,
          error: 'session, chatId, and messageId are required',
        },
        400,
      );
    }

    const result = await downloadMessageMedia(
      session,
      chatId,
      chatType,
      accessHash,
      messageId,
    );

    if (!result) {
      return c.json(
        { success: false, error: 'Media not found or not downloadable' },
        404,
      );
    }

    return new Response(new Uint8Array(result.buffer), {
      headers: {
        'Content-Type': result.mimeType,
        'Cache-Control': 'public, max-age=86400, immutable',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to download media';
    console.error('media download error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

mediaRoutes.get('/avatar/v1', async (c) => {
  const session = c.req.query('session');
  const peerId = c.req.query('peerId');
  const peerType = c.req.query('peerType') ?? 'user';
  const accessHash = c.req.query('accessHash') ?? '';

  if (!session || !peerId) {
    return c.json({ error: 'session and peerId are required' }, 400);
  }

  try {
    const buffer = await downloadPeerPhoto(
      session,
      peerId,
      peerType,
      accessHash,
    );

    if (!buffer) {
      return c.json({ error: 'no photo' }, 404);
    }

    return new Response(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'public, max-age=3600, stale-while-revalidate=7200',
      },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to fetch avatar';
    console.error('avatar error:', err);
    return c.json({ error: message }, 500);
  }
});
