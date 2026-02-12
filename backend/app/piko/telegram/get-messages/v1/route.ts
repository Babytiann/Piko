import { NextResponse } from 'next/server';
import { Api } from 'telegram';
import { getPooledClient, resolveInputPeer } from '@/lib/telegram';

/**
 * POST /piko/telegram/get-messages/v1
 * Get messages from a specific chat.
 *
 * Body: { session: string, chatId: string, chatType: string, accessHash: string, limit?: number, offsetId?: number }
 * Returns: { success: true, messages: Array<Message> }
 */
export async function POST(request: Request) {
  try {
    const {
      session,
      chatId,
      chatType,
      accessHash,
      limit = 30,
      offsetId,
    } = (await request.json()) as {
      session: string;
      chatId: string;
      chatType: string;
      accessHash: string;
      limit?: number;
      offsetId?: number;
    };

    if (!session || !chatId) {
      return NextResponse.json(
        { success: false, error: 'session and chatId are required' },
        { status: 400 },
      );
    }

    const client = await getPooledClient(session);
    const peer = resolveInputPeer(chatId, chatType, accessHash);

    const messages = await client.getMessages(peer, {
      limit,
      offsetId,
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
          senderName = msg.sender.title ?? 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        }
      }

      return {
        id: msg.id,
        text: msg.message ?? '',
        date: msg.date,
        senderId,
        senderName,
        isOutgoing,
        isMe: senderId === myId,
        replyToMsgId: msg.replyTo
          ? ((msg.replyTo as Api.MessageReplyHeader).replyToMsgId ?? null)
          : null,
        hasMedia: !!msg.media,
        mediaType: msg.media ? msg.media.className : null,
      };
    });

    return NextResponse.json({
      success: true,
      messages: formattedMessages,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to get messages';
    console.error('get-messages error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
