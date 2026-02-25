/** Data contracts for Chat list and Chat detail pages. */

export interface DialogItem {
  id: string;
  title: string;
  type: 'user' | 'group' | 'channel';
  access_hash: string;
  avatar_text: string;
  avatar_color: string;
  /** URL to fetch the peer's profile photo via the avatar proxy. */
  avatar_url?: string;
  last_message: string;
  last_message_time: string;
  unread_count: number;
  pinned: boolean;
}

export interface UnboundState {
  title: string;
  description: string;
  bind_button_text: string;
}

export interface ChatListPageData {
  header: { title: string };
  dialogs?: DialogItem[];
  unbound_state?: UnboundState;
}

export interface MessageItem {
  id: number;
  text: string;
  time: string;
  sender_name: string;
  /** URL to fetch the sender's profile photo via the avatar proxy. */
  sender_avatar_url?: string;
  is_me: boolean;
  has_media: boolean;
  media_type: string | null;
  /** URL to download the media via the /telegram/media/v1 proxy endpoint. */
  media_url: string | null;
  /** ID of the message this message is replying to, if any. */
  reply_to_msg_id: number | null;
  /** Preview text of the replied-to message. */
  reply_to_text: string | null;
  /** Sender name of the replied-to message. */
  reply_to_sender_name: string | null;
}

export interface ChatDetailPageData {
  header: { title: string };
  messages: MessageItem[];
  input_placeholder: string;
  /** Whether there are more (older) messages available to load. */
  has_more: boolean;
  /** The id of the oldest message in the current batch, used as offsetId for pagination. */
  oldest_message_id?: number;
}
