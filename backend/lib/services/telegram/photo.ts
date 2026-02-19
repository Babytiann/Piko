import { getPooledClient, resolveInputPeer } from '@/lib/telegram';

interface PhotoCacheEntry {
  buffer: Buffer;
  timestamp: number;
}

const PHOTO_CACHE_TTL = 5 * 60 * 1000;
const photoCache = new Map<string, PhotoCacheEntry>();

function sessionCacheKey(session: string): string {
  return session.slice(0, 32);
}

function bufferToDataUri(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

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

export async function downloadPeerPhoto(
  session: string,
  peerId: string,
  peerType: string,
  accessHash: string,
): Promise<Buffer | null> {
  const client = await getPooledClient(session);
  const peer = resolveInputPeer(peerId, peerType, accessHash);
  try {
    const photo = await client.downloadProfilePhoto(peer);
    if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
      return null;
    }
    return Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
  } catch {
    return null;
  }
}

export async function getProfilePhotoBase64(
  session: string,
): Promise<string | undefined> {
  const { buffer } = await getProfilePhoto(session);
  return buffer ? bufferToDataUri(buffer) : undefined;
}
