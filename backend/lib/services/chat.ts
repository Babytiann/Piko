import type {
  ChatListPageData,
  ChatDetailPageData,
  MessageItem,
} from '@/types/chat';
import type { RawMessage } from '@/types/telegram';
import { getDialogList, getMessageList } from './telegram';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const AVATAR_COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#45B7D1',
  '#96CEB4',
  '#FFEAA7',
  '#DDA0DD',
  '#98D8C8',
  '#F7DC6F',
];

function getAvatarColor(id: string): string {
  const index = Math.abs(parseInt(id, 10) || 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

function formatTime(timestamp: number | null): string {
  if (!timestamp) return '';
  const date = new Date(timestamp * 1000);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天';
  }

  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatMessageTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** Build the avatar proxy URL for a peer. */
function buildAvatarUrl(
  session: string,
  peerId: string,
  peerType: string,
  accessHash: string,
): string {
  const params = new URLSearchParams({
    session,
    peerId,
    peerType,
    accessHash,
  });
  return `/piko/telegram/avatar/v1?${params.toString()}`;
}

/** Build the media proxy URL for a message with downloadable media. */
function buildMediaUrl(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  messageId: number,
): string {
  const params = new URLSearchParams({
    session,
    chatId,
    chatType,
    accessHash,
    messageId: messageId.toString(),
  });
  return `/piko/telegram/media/v1?${params.toString()}`;
}

/** Media types that we can render as an image in the client. */
const IMAGE_MEDIA_TYPES = new Set([
  'MessageMediaPhoto',
  'MessageMediaDocument', // covers stickers, GIFs, etc. — client filters by mime
]);

/** Truncate a string for reply preview display. */
function truncateText(text: string, maxLength = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '…';
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Aggregate all data needed by the Chat list (messages tab) page.
 */
export async function getChatListPageData(
  session?: string,
): Promise<ChatListPageData> {
  if (!session) {
    return {
      header: { title: '消息' },
      unbound_state: {
        title: '尚未绑定 Telegram 账号',
        description: '前往「个人中心」绑定你的 Telegram 账号后，即可查看消息。',
        bind_button_text: '前往绑定',
      },
    };
  }

  const rawDialogs = await getDialogList(session, 50);

  return {
    header: { title: '消息' },
    dialogs: rawDialogs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      access_hash: d.access_hash,
      avatar_text: d.title.charAt(0).toUpperCase(),
      avatar_color: getAvatarColor(d.id),
      avatar_url: buildAvatarUrl(session, d.id, d.type, d.access_hash),
      last_message: d.last_message || '...',
      last_message_time: formatTime(d.last_message_date),
      unread_count: d.unread_count,
      pinned: d.pinned,
    })),
  };
}

/**
 * Aggregate all data needed by a single Chat detail page.
 */
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

  // Build a lookup map so we can resolve reply references cheaply.
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

  // Determine pagination info
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
