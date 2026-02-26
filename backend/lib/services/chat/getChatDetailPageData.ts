import type { ChatDetailPageData, MessageItem } from '@/types/chat';
import type { RawMessage } from '@/types/telegram';
import { getMessageList } from '../telegram';
import {
  formatMessageTime,
  buildAvatarUrl,
  buildMediaUrl,
  IMAGE_MEDIA_TYPES,
  truncateText,
} from './helpers';

export async function getChatDetailPageData(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  title: string,
  limit = 50,
  offsetId?: number,
): Promise<ChatDetailPageData> {
  const rawMessages = await getMessageList(
    session,
    chatId,
    chatType,
    accessHash,
    limit,
    offsetId,
  );

  const messageById = new Map<number, RawMessage>();
  for (const m of rawMessages) {
    messageById.set(m.id, m);
  }

  const messages: MessageItem[] = rawMessages.map((m) => {
    const mediaUrl =
      m.has_media && m.media_type && IMAGE_MEDIA_TYPES.has(m.media_type)
        ? buildMediaUrl(session, chatId, chatType, accessHash, m.id)
        : null;

    let reply_to_text: string | null = null;
    let reply_to_sender_name: string | null = null;
    if (m.reply_to_msg_id != null) {
      const repliedMsg = messageById.get(m.reply_to_msg_id);
      if (repliedMsg) {
        reply_to_text = truncateText(
          repliedMsg.text ||
            (repliedMsg.has_media
              ? `[${repliedMsg.media_type ?? '媒体'}]`
              : ''),
        );
        reply_to_sender_name = repliedMsg.sender_name || null;
      }
    }

    const sender_avatar_url =
      !(m.is_me || m.is_outgoing) && m.sender_id
        ? buildAvatarUrl(
            session,
            m.sender_id,
            m.sender_type,
            m.sender_access_hash,
          )
        : undefined;

    return {
      id: m.id,
      text: m.text,
      time: formatMessageTime(m.date),
      sender_name: m.sender_name,
      sender_avatar_url,
      is_me: m.is_me || m.is_outgoing,
      has_media: m.has_media,
      media_type: m.media_type,
      media_url: mediaUrl,
      reply_to_msg_id: m.reply_to_msg_id,
      reply_to_text,
      reply_to_sender_name,
    };
  });

  const has_more = rawMessages.length >= limit;
  const oldest_message_id =
    rawMessages.length > 0 ? rawMessages[rawMessages.length - 1].id : undefined;

  return {
    header: { title },
    messages,
    input_placeholder: '输入消息...',
    has_more,
    oldest_message_id,
  };
}
