import { Api } from 'telegram';
import {
  createAuthenticatedClient,
  disconnectClient,
  resolveInputPeer,
} from '@/lib/telegram';

// ---------------------------------------------------------------------------
// Types (internal to service layer)
// ---------------------------------------------------------------------------

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
  isOutgoing: boolean;
  isMe: boolean;
  replyToMsgId: number | null;
  hasMedia: boolean;
  mediaType: string | null;
}

// ---------------------------------------------------------------------------
// Profile photo in-memory cache (TTL 5 min)
// ---------------------------------------------------------------------------

interface PhotoCacheEntry {
  buffer: Buffer;
  timestamp: number;
}

const PHOTO_CACHE_TTL = 5 * 60 * 1000;
const photoCache = new Map<string, PhotoCacheEntry>();

function sessionCacheKey(session: string): string {
  // Use first 32 chars as key to avoid huge map keys
  return session.slice(0, 32);
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/** Get current user info from Telegram via session. */
export async function getUserInfo(session: string): Promise<TelegramUserInfo> {
  const client = await createAuthenticatedClient(session);
  try {
    const me = (await client.getMe()) as Api.User;
    return {
      id: me.id.toString(),
      firstName: me.firstName ?? '',
      lastName: me.lastName ?? '',
      username: me.username ?? '',
      phone: me.phone ?? '',
      hasPhoto: !!me.photo,
    };
  } finally {
    await disconnectClient(client);
  }
}

/** Lightweight check: does the current user have a profile photo? */
export async function hasProfilePhoto(session: string): Promise<boolean> {
  const info = await getUserInfo(session);
  return info.hasPhoto;
}

/** Download the current user's profile photo. Returns buffer + flag. */
export async function getProfilePhoto(
  session: string,
): Promise<{ buffer: Buffer | null; hasPhoto: boolean }> {
  const key = sessionCacheKey(session);
  const cached = photoCache.get(key);
  if (cached && Date.now() - cached.timestamp < PHOTO_CACHE_TTL) {
    return { buffer: cached.buffer, hasPhoto: true };
  }

  const client = await createAuthenticatedClient(session);
  try {
    const photo = await client.downloadProfilePhoto('me');
    if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
      return { buffer: null, hasPhoto: false };
    }

    const buf = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
    photoCache.set(key, { buffer: buf, timestamp: Date.now() });
    return { buffer: buf, hasPhoto: true };
  } finally {
    await disconnectClient(client);
  }
}

/** Fetch the dialog (chat) list for an authenticated user. */
export async function getDialogList(
  session: string,
  limit = 30,
  offsetDate?: number,
): Promise<RawDialog[]> {
  const client = await createAuthenticatedClient(session);
  try {
    const dialogs = await client.getDialogs({ limit, offsetDate });

    return dialogs.map((dialog) => {
      const entity = dialog.entity;
      let title = dialog.title ?? 'Unknown';
      let type: 'user' | 'group' | 'channel' = 'user';
      let username = '';
      let accessHash = '';

      if (entity instanceof Api.User) {
        title =
          [entity.firstName, entity.lastName].filter(Boolean).join(' ') ||
          'Unknown';
        username = entity.username ?? '';
        type = 'user';
        accessHash = entity.accessHash?.toString() ?? '';
      } else if (entity instanceof Api.Chat) {
        title = entity.title;
        type = 'group';
      } else if (entity instanceof Api.Channel) {
        title = entity.title;
        username = entity.username ?? '';
        type = entity.megagroup ? 'group' : 'channel';
        accessHash = entity.accessHash?.toString() ?? '';
      }

      let lastMessage = '';
      let lastMessageDate: number | null = null;
      if (dialog.message) {
        lastMessage = dialog.message.message ?? '';
        lastMessageDate = dialog.message.date ?? null;
      }

      return {
        id: dialog.id?.toString() ?? '',
        title,
        type,
        username,
        accessHash,
        unreadCount: dialog.unreadCount,
        lastMessage,
        lastMessageDate,
        pinned: dialog.pinned,
      };
    });
  } finally {
    await disconnectClient(client);
  }
}

/** Fetch messages from a specific chat. */
export async function getMessageList(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  limit = 30,
  offsetId?: number,
): Promise<RawMessage[]> {
  const client = await createAuthenticatedClient(session);
  try {
    const peer = resolveInputPeer(chatId, chatType, accessHash);
    const messages = await client.getMessages(peer, { limit, offsetId });

    const me = await client.getMe();
    const myId = me.id?.toString();

    return messages.map((msg) => {
      let senderName = '';
      let senderId = '';
      const isOutgoing = msg.out ?? false;

      if (msg.sender) {
        if (msg.sender instanceof Api.User) {
          senderName =
            [msg.sender.firstName, msg.sender.lastName]
              .filter(Boolean)
              .join(' ') || 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        } else if (
          msg.sender instanceof Api.Chat ||
          msg.sender instanceof Api.Channel
        ) {
          senderName = msg.sender.title ?? 'Unknown';
          senderId = msg.sender.id?.toString() ?? '';
        }
      }

      return {
        id: msg.id,
        text: msg.message ?? '',
        date: msg.date,
        senderId,
        senderName,
        isOutgoing,
        isMe: senderId === myId,
        replyToMsgId: msg.replyTo
          ? ((msg.replyTo as Api.MessageReplyHeader).replyToMsgId ?? null)
          : null,
        hasMedia: !!msg.media,
        mediaType: msg.media ? msg.media.className : null,
      };
    });
  } finally {
    await disconnectClient(client);
  }
}
