export interface TelegramUserInfo {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  has_photo: boolean;
}

export interface RawDialog {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  username: string;
  access_hash: string;
  unread_count: number;
  last_message: string;
  last_message_date: number | null;
  pinned: boolean;
}

export interface RawMessage {
  id: number;
  text: string;
  date: number;
  sender_id: string;
  sender_name: string;
  sender_type: 'user' | 'group' | 'channel';
  sender_access_hash: string;
  is_outgoing: boolean;
  is_me: boolean;
  reply_to_msg_id: number | null;
  has_media: boolean;
  media_type: string | null;
}
