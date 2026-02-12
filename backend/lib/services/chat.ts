import type {
  ChatListPageData,
  ChatDetailPageData,
  MessageItem,
} from '@/types/chat';
import type { RawMessage } from './telegram';
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
      unboundState: {
        title: '尚未绑定 Telegram 账号',
        description: '前往「个人中心」绑定你的 Telegram 账号后，即可查看消息。',
        bindButtonText: '前往绑定',
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
      accessHash: d.accessHash,
      avatarText: d.title.charAt(0).toUpperCase(),
      avatarColor: getAvatarColor(d.id),
      avatarUrl: buildAvatarUrl(session, d.id, d.type, d.accessHash),
      lastMessage: d.lastMessage || '...',
      lastMessageTime: formatTime(d.lastMessageDate),
      unreadCount: d.unreadCount,
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
): Promise<ChatDetailPageData> {
  const rawMessages = await getMessageList(
    session,
    chatId,
    chatType,
    accessHash,
    limit,
  );

  // Build a lookup map so we can resolve reply references cheaply.
  const messageById = new Map<number, RawMessage>();
  for (const m of rawMessages) {
    messageById.set(m.id, m);
  }

  const messages: MessageItem[] = rawMessages.map((m) => {
    // Media URL — only for types we can meaningfully render
    const mediaUrl =
      m.hasMedia && m.mediaType && IMAGE_MEDIA_TYPES.has(m.mediaType)
        ? buildMediaUrl(session, chatId, chatType, accessHash, m.id)
        : null;

    // Reply preview — look up in the current batch
    let replyToText: string | null = null;
    let replyToSenderName: string | null = null;
    if (m.replyToMsgId != null) {
      const repliedMsg = messageById.get(m.replyToMsgId);
      if (repliedMsg) {
        replyToText = truncateText(
          repliedMsg.text ||
            (repliedMsg.hasMedia ? `[${repliedMsg.mediaType ?? '媒体'}]` : ''),
        );
        replyToSenderName = repliedMsg.senderName || null;
      }
    }

    // Sender avatar — skip for outgoing messages (we don't need our own avatar)
    const senderAvatarUrl =
      !(m.isMe || m.isOutgoing) && m.senderId
        ? buildAvatarUrl(session, m.senderId, m.senderType, m.senderAccessHash)
        : undefined;

    return {
      id: m.id,
      text: m.text,
      time: formatMessageTime(m.date),
      senderName: m.senderName,
      senderAvatarUrl,
      isMe: m.isMe || m.isOutgoing,
      hasMedia: m.hasMedia,
      mediaType: m.mediaType,
      mediaUrl,
      replyToMsgId: m.replyToMsgId,
      replyToText,
      replyToSenderName,
    };
  });

  return {
    header: { title },
    messages,
    inputPlaceholder: '输入消息...',
  };
}
