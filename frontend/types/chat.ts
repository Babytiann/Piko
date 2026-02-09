/** Data contracts for Chat list and Chat detail pages (mirrors backend). */

export interface DialogItem {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  accessHash: string;
  avatarText: string;
  avatarColor: string;
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
  isMe: boolean;
  hasMedia: boolean;
  mediaType: string | null;
}

export interface ChatDetailPageData {
  header: { title: string };
  messages: MessageItem[];
  inputPlaceholder: string;
}
