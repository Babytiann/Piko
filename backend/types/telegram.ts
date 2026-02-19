export interface TelegramUserInfo {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  hasPhoto: boolean;
}

export interface RawDialog {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  username: string;
  accessHash: string;
  unreadCount: number;
  lastMessage: string;
  lastMessageDate: number | null;
  pinned: boolean;
}

export interface RawMessage {
  id: number;
  text: string;
  date: number;
  senderId: string;
  senderName: string;
  senderType: 'user' | 'group' | 'channel';
  senderAccessHash: string;
  isOutgoing: boolean;
  isMe: boolean;
  replyToMsgId: number | null;
  hasMedia: boolean;
  mediaType: string | null;
}
