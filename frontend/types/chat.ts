/** Data contracts for Chat list and Chat detail pages (mirrors backend). */

export interface DialogItem {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  accessHash: string;
  avatarText: string;
  avatarColor: string;
  /** URL to fetch the peer's profile photo via the avatar proxy. */
  avatarUrl?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  pinned: boolean;
}

export interface UnboundState {
  title: string;
  description: string;
  bindButtonText: string;
}

export interface ChatListPageData {
  header: { title: string };
  dialogs?: DialogItem[];
  unboundState?: UnboundState;
}

export interface MessageItem {
  id: number;
  text: string;
  time: string;
  senderName: string;
  /** URL to fetch the sender's profile photo via the avatar proxy. */
  senderAvatarUrl?: string;
  isMe: boolean;
  hasMedia: boolean;
  mediaType: string | null;
  /** URL to download the media via the backend proxy endpoint. */
  mediaUrl: string | null;
  /** ID of the message this message is replying to, if any. */
  replyToMsgId: number | null;
  /** Preview text of the replied-to message. */
  replyToText: string | null;
  /** Sender name of the replied-to message. */
  replyToSenderName: string | null;
}

export interface ChatDetailPageData {
  header: { title: string };
  messages: MessageItem[];
  inputPlaceholder: string;
  /** Whether there are more (older) messages available to load. */
  hasMore: boolean;
  /** The id of the oldest message in the current batch, used as offsetId for pagination. */
  oldestMessageId?: number;
}
