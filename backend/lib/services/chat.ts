import type {
  ChatListPageData,
  ChatDetailPageData,
  MessageItem,
} from '@/types/chat';
import type { RawMessage, PeerRef } from './telegram';
import {
  getDialogList,
  getMessageList,
  getPeerPhotoFromCache,
  warmPeerPhotoCache,
} from './telegram';

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

  const peers: PeerRef[] = rawDialogs.map((d) => ({
    peerId: d.id,
    peerType: d.type,
    accessHash: d.accessHash,
  }));

  // Kick off background download for uncached photos (fire-and-forget)
  warmPeerPhotoCache(session, peers);

  return {
    header: { title: '消息' },
    dialogs: rawDialogs.map((d) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      accessHash: d.accessHash,
      avatarText: d.title.charAt(0).toUpperCase(),
      avatarColor: getAvatarColor(d.id),
      img_url: getPeerPhotoFromCache(session, d.id),
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

  // Collect unique non-self senders for background cache warming.
  const senderPeers: PeerRef[] = [];
  const seenSenders = new Set<string>();
  for (const m of rawMessages) {
    if (
      !(m.isMe || m.isOutgoing) &&
      m.senderId &&
      !seenSenders.has(m.senderId)
    ) {
      seenSenders.add(m.senderId);
      senderPeers.push({
        peerId: m.senderId,
        peerType: m.senderType,
        accessHash: m.senderAccessHash,
      });
    }
  }
  warmPeerPhotoCache(session, senderPeers);

  const messages: MessageItem[] = rawMessages.map((m) => {
    const mediaUrl =
      m.hasMedia && m.mediaType && IMAGE_MEDIA_TYPES.has(m.mediaType)
        ? buildMediaUrl(session, chatId, chatType, accessHash, m.id)
        : null;

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

    const img_url =
      !(m.isMe || m.isOutgoing) && m.senderId
        ? getPeerPhotoFromCache(session, m.senderId)
        : undefined;

    return {
      id: m.id,
      text: m.text,
      time: formatMessageTime(m.date),
      senderName: m.senderName,
      img_url,
      isMe: m.isMe || m.isOutgoing,
      hasMedia: m.hasMedia,
      mediaType: m.mediaType,
      mediaUrl,
      replyToMsgId: m.replyToMsgId,
      replyToText,
      replyToSenderName,
    };
  });

  // Determine pagination info
  const hasMore = rawMessages.length >= limit;
  const oldestMessageId =
    rawMessages.length > 0 ? rawMessages[rawMessages.length - 1].id : undefined;

  return {
    header: { title },
    messages,
    inputPlaceholder: '输入消息...',
    hasMore,
    oldestMessageId,
  };
}
