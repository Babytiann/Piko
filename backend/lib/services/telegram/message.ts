import { Api } from 'telegram';

import { getPooledClient, resolveInputPeer } from '@/lib/telegram';
import type { RawMessage } from '@/types/telegram';

export async function downloadMessageMedia(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  messageId: number,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const client = await getPooledClient(session);
  const peer = resolveInputPeer(chatId, chatType, accessHash);
  const messages = await client.getMessages(peer, { ids: [messageId] });
  const msg = messages[0];
  if (!msg?.media) return null;

  const data = await client.downloadMedia(msg, {});
  if (!data) return null;

  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  let mimeType = 'application/octet-stream';
  if (msg.media instanceof Api.MessageMediaPhoto) {
    mimeType = 'image/jpeg';
  } else if (msg.media instanceof Api.MessageMediaDocument) {
    const doc = msg.media.document;
    if (doc instanceof Api.Document && doc.mimeType) {
      mimeType = doc.mimeType;
    }
  }

  return { buffer: buf, mimeType };
}

export async function getMessageList(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  limit = 30,
  offsetId?: number,
): Promise<RawMessage[]> {
  const client = await getPooledClient(session);
  const peer = resolveInputPeer(chatId, chatType, accessHash);

  // 新连接可能缺少 channel 的 entity 缓存，先加载少量对话列表来填充
  let messages;
  try {
    messages = await client.getMessages(peer, { limit, offsetId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('CHANNEL_INVALID') || msg.includes('PEER_ID_INVALID')) {
      await client.getDialogs({ limit: 10 });
      messages = await client.getMessages(peer, { limit, offsetId });
    } else {
      throw err;
    }
  }

  const me = await client.getMe();
  const myId = me.id?.toString();

  return messages.map((m) => {
    let senderName = '';
    let senderId = '';
    let senderType: 'user' | 'group' | 'channel' = 'user';
    let senderAccessHash = '';
    const isOutgoing = m.out ?? false;

    if (m.sender) {
      if (m.sender instanceof Api.User) {
        senderName =
          [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') ||
          'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = 'user';
        senderAccessHash = m.sender.accessHash?.toString() ?? '';
      } else if (m.sender instanceof Api.Channel) {
        senderName = m.sender.title ?? 'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = m.sender.megagroup ? 'group' : 'channel';
        senderAccessHash = m.sender.accessHash?.toString() ?? '';
      } else if (m.sender instanceof Api.Chat) {
        senderName = m.sender.title ?? 'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = 'group';
      }
    }

    return {
      id: m.id,
      text: m.message ?? '',
      date: m.date,
      senderId,
      senderName,
      senderType,
      senderAccessHash,
      isOutgoing,
      isMe: senderId === myId,
      replyToMsgId:
        m.replyTo instanceof Api.MessageReplyHeader
          ? (m.replyTo.replyToMsgId ?? null)
          : null,
      hasMedia: !!m.media,
      mediaType: m.media ? m.media.className : null,
    };
  });
}
