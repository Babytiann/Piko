import type { ChatListPageData, ChatDetailPageData } from '@/types/chat';
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

  return {
    header: { title },
    messages: rawMessages.map((m) => ({
      id: m.id,
      text: m.text,
      time: formatMessageTime(m.date),
      senderName: m.senderName,
      isMe: m.isMe || m.isOutgoing,
      hasMedia: m.hasMedia,
      mediaType: m.mediaType,
    })),
    inputPlaceholder: '输入消息...',
  };
}
