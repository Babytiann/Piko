import { Hono } from 'hono';
import { Api } from 'telegram';
import {
  getPooledClient,
  resolveInputPeer,
} from '../../../lib/telegram/index.js';

export const messagesRoutes = new Hono();

messagesRoutes.post('/get-messages/v1', async (c) => {
  try {
    const body = (await c.req.json()) as {
      session: string;
      chat_id: string;
      chat_type?: string;
      access_hash?: string;
      limit?: number;
      offset_id?: number;
    };

    if (!body.session || !body.chat_id) {
      return c.json(
        { success: false, error: 'session and chat_id are required' },
        400,
      );
    }

    const client = await getPooledClient(body.session);
    const peer = resolveInputPeer(
      body.chat_id,
      body.chat_type ?? 'user',
      body.access_hash ?? '',
    );
    const messages = await client.getMessages(peer, {
      limit: body.limit ?? 30,
      offsetId: body.offset_id,
    });

    const me = await client.getMe();
    const myId = me.id?.toString();

    const formattedMessages = messages.map((msg) => {
      let senderName = '';
      let senderId = '';
      const isOutgoing = msg.out ?? false;

      if (msg.sender) {
        if (msg.sender instanceof Api.User) {
          senderName =
            [msg.sender.firstName, msg.sender.lastName]
              .filter(Boolean)
              .join(' ') || 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        } else if (
          msg.sender instanceof Api.Chat ||
          msg.sender instanceof Api.Channel
        ) {
          senderName =
            (msg.sender as Api.Chat | Api.Channel).title ?? 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        }
      }

      return {
        id: msg.id,
        text: msg.message ?? '',
        date: msg.date,
        sender_id: senderId,
        sender_name: senderName,
        is_outgoing: isOutgoing,
        is_me: senderId === myId,
        reply_to_msg_id: msg.replyTo
          ? ((msg.replyTo as Api.MessageReplyHeader).replyToMsgId ?? null)
          : null,
        has_media: !!msg.media,
        media_type: msg.media ? msg.media.className : null,
      };
    });

    return c.json({ success: true, messages: formattedMessages });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to get messages';
    console.error('get-messages error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

messagesRoutes.post('/send-message/v1', async (c) => {
  try {
    const body = (await c.req.json()) as {
      session: string;
      chat_id: string;
      chat_type?: string;
      access_hash?: string;
      message: string;
      reply_to_msg_id?: number;
    };

    if (!body.session || !body.chat_id || !body.message) {
      return c.json(
        { success: false, error: 'session, chat_id, and message are required' },
        400,
      );
    }

    const client = await getPooledClient(body.session);
    const peer = resolveInputPeer(
      body.chat_id,
      body.chat_type ?? 'user',
      body.access_hash ?? '',
    );

    const result = await client.sendMessage(peer, {
      message: body.message,
      replyTo: body.reply_to_msg_id,
    });

    return c.json({
      success: true,
      message_id: result.id,
      date: result.date,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to send message';
    console.error('send-message error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
