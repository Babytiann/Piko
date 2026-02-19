import { Api } from 'telegram';
import parsePhoneNumber from 'libphonenumber-js';
import { getPooledClient, resolveInputPeer } from '@/lib/telegram';

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

interface PhotoCacheEntry {
  buffer: Buffer;
  timestamp: number;
}

const PHOTO_CACHE_TTL = 5 * 60 * 1000;
const NO_PHOTO_CACHE_TTL = 60 * 1000;
const photoCache = new Map<string, PhotoCacheEntry>();

interface PeerPhotoCacheEntry {
  buffer: Buffer | null;
  timestamp: number;
}
const peerPhotoCache = new Map<string, PeerPhotoCacheEntry>();

function sessionCacheKey(session: string): string {
  return session.slice(0, 32);
}

function peerCacheKey(session: string, peerId: string): string {
  return `${session.slice(0, 16)}:${peerId}`;
}

function bufferToDataUri(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

export interface PeerRef {
  peerId: string;
  peerType: string;
  accessHash: string;
}

export async function getUserInfo(session: string): Promise<TelegramUserInfo> {
  const client = await getPooledClient(session);
  const { id, firstName, lastName, username, phone, photo } =
    (await client.getMe()) as Api.User;
  const parsed = phone ? parsePhoneNumber(`+${phone}`) : null;
  const processedPhone = parsed
    ? `+${parsed.countryCallingCode} ${parsed.nationalNumber}`
    : '';
  return {
    id: id.toString(),
    firstName: firstName ?? '',
    lastName: lastName ?? '',
    username: username ?? '',
    phone: processedPhone ?? '',
    hasPhoto: !!photo,
  };
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

  const client = await getPooledClient(session);
  const photo = await client.downloadProfilePhoto('me');
  if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
    return { buffer: null, hasPhoto: false };
  }

  const buf = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
  photoCache.set(key, { buffer: buf, timestamp: Date.now() });
  return { buffer: buf, hasPhoto: true };
}

/**
 * Download a profile photo for any peer (user, chat, or channel).
 * Returns the photo buffer or null if no photo is available.
 */
export async function downloadPeerPhoto(
  session: string,
  peerId: string,
  peerType: string,
  accessHash: string,
): Promise<Buffer | null> {
  const key = peerCacheKey(session, peerId);
  const cached = peerPhotoCache.get(key);
  if (cached) {
    const ttl = cached.buffer ? PHOTO_CACHE_TTL : NO_PHOTO_CACHE_TTL;
    if (Date.now() - cached.timestamp < ttl) {
      return cached.buffer;
    }
    peerPhotoCache.delete(key);
  }

  const client = await getPooledClient(session);
  const peer = resolveInputPeer(peerId, peerType, accessHash);
  try {
    const photo = await client.downloadProfilePhoto(peer);
    if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
      peerPhotoCache.set(key, { buffer: null, timestamp: Date.now() });
      return null;
    }
    const buf = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
    peerPhotoCache.set(key, { buffer: buf, timestamp: Date.now() });
    return buf;
  } catch {
    // Don't cache errors — allow retry on next request
    return null;
  }
}

/** Get the current user's profile photo as a base64 data URI. */
export async function getProfilePhotoBase64(
  session: string,
): Promise<string | undefined> {
  const { buffer } = await getProfilePhoto(session);
  return buffer ? bufferToDataUri(buffer) : undefined;
}

/**
 * Synchronously read a peer's photo from cache.
 * Returns a base64 data URI if cached, undefined otherwise.
 */
export function getPeerPhotoFromCache(
  session: string,
  peerId: string,
): string | undefined {
  const key = peerCacheKey(session, peerId);
  const cached = peerPhotoCache.get(key);
  if (!cached) return undefined;
  const ttl = cached.buffer ? PHOTO_CACHE_TTL : NO_PHOTO_CACHE_TTL;
  if (Date.now() - cached.timestamp >= ttl) {
    peerPhotoCache.delete(key);
    return undefined;
  }
  return cached.buffer ? bufferToDataUri(cached.buffer) : undefined;
}

const warmingInProgress = new Set<string>();

/**
 * Fire-and-forget: download photos for peers that are NOT yet cached.
 * Downloads sequentially (one at a time) to avoid overwhelming the
 * Telegram MTProto connection. Results are written to peerPhotoCache
 * so that the *next* request can serve them inline.
 */
export function warmPeerPhotoCache(session: string, peers: PeerRef[]): void {
  const uncached: PeerRef[] = [];
  const seen = new Set<string>();
  for (const p of peers) {
    if (seen.has(p.peerId)) continue;
    seen.add(p.peerId);
    const key = peerCacheKey(session, p.peerId);
    const cached = peerPhotoCache.get(key);
    if (cached) {
      const ttl = cached.buffer ? PHOTO_CACHE_TTL : NO_PHOTO_CACHE_TTL;
      if (Date.now() - cached.timestamp < ttl) continue;
    }
    if (warmingInProgress.has(key)) continue;
    uncached.push(p);
  }

  if (uncached.length === 0) return;

  // Mark all as in-progress to avoid duplicate warming
  for (const p of uncached) {
    warmingInProgress.add(peerCacheKey(session, p.peerId));
  }

  // Sequential download in background — don't await
  void (async () => {
    for (const p of uncached) {
      try {
        await downloadPeerPhoto(session, p.peerId, p.peerType, p.accessHash);
      } catch {
        // ignore
      } finally {
        warmingInProgress.delete(peerCacheKey(session, p.peerId));
      }
    }
  })();
}

export async function getDialogList(
  session: string,
  limit = 30,
  offsetDate?: number,
): Promise<RawDialog[]> {
  const client = await getPooledClient(session);
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
      if (!lastMessage && dialog.message.media) {
        const mediaName = dialog.message.media.className;
        if (mediaName === 'MessageMediaPhoto') lastMessage = '[图片]';
        else if (mediaName === 'MessageMediaDocument') lastMessage = '[文件]';
        else lastMessage = '[媒体]';
      }
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
}

export async function downloadMessageMedia(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  messageId: number,
): Promise<{ buffer: Buffer; mimeType: string } | null> {
  const client = await getPooledClient(session);
  const peer = resolveInputPeer(chatId, chatType, accessHash);
  const messages = await client.getMessages(peer, { ids: [messageId] });
  const msg = messages[0];
  if (!msg?.media) return null;

  const data = await client.downloadMedia(msg, {});
  if (!data) return null;

  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);

  let mimeType = 'application/octet-stream';
  if (msg.media instanceof Api.MessageMediaPhoto) {
    mimeType = 'image/jpeg';
  } else if (msg.media instanceof Api.MessageMediaDocument) {
    const doc = msg.media.document;
    if (doc instanceof Api.Document && doc.mimeType) {
      mimeType = doc.mimeType;
    }
  }

  return { buffer: buf, mimeType };
}

export async function getMessageList(
  session: string,
  chatId: string,
  chatType: string,
  accessHash: string,
  limit = 30,
  offsetId?: number,
): Promise<RawMessage[]> {
  const client = await getPooledClient(session);
  const peer = resolveInputPeer(chatId, chatType, accessHash);

  // Fetch messages — with CHANNEL_INVALID fallback for channels/supergroups.
  // A freshly-pooled client may lack the entity cache entry for certain
  // channels; loading a small dialog list populates it.
  let messages;
  try {
    messages = await client.getMessages(peer, { limit, offsetId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('CHANNEL_INVALID') || msg.includes('PEER_ID_INVALID')) {
      await client.getDialogs({ limit: 10 });
      messages = await client.getMessages(peer, { limit, offsetId });
    } else {
      throw err;
    }
  }

  const me = await client.getMe();
  const myId = me.id?.toString();

  return messages.map((m) => {
    let senderName = '';
    let senderId = '';
    let senderType: 'user' | 'group' | 'channel' = 'user';
    let senderAccessHash = '';
    const isOutgoing = m.out ?? false;

    if (m.sender) {
      if (m.sender instanceof Api.User) {
        senderName =
          [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ') ||
          'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = 'user';
        senderAccessHash = m.sender.accessHash?.toString() ?? '';
      } else if (m.sender instanceof Api.Channel) {
        senderName = m.sender.title ?? 'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = m.sender.megagroup ? 'group' : 'channel';
        senderAccessHash = m.sender.accessHash?.toString() ?? '';
      } else if (m.sender instanceof Api.Chat) {
        senderName = m.sender.title ?? 'Unknown';
        senderId = m.sender.id?.toString() ?? '';
        senderType = 'group';
      }
    }

    return {
      id: m.id,
      text: m.message ?? '',
      date: m.date,
      senderId,
      senderName,
      senderType,
      senderAccessHash,
      isOutgoing,
      isMe: senderId === myId,
      replyToMsgId: m.replyTo
        ? ((m.replyTo as Api.MessageReplyHeader).replyToMsgId ?? null)
        : null,
      hasMedia: !!m.media,
      mediaType: m.media ? m.media.className : null,
    };
  });
}
