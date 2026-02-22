import { Api } from 'telegram';
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

  try {
    // 优先从 GramJS 实体缓存解析（getDialogs 调用时已填充缓存），
    // 缓存中有正确的 accessHash，不需要前端传入。
    let entity: Api.TypeInputPeer;
    try {
      let peerRef: Api.PeerUser | Api.PeerChat | Api.PeerChannel;
      const id = BigInt(peerId) as unknown as Api.long;
      switch (peerType) {
        case 'channel':
          peerRef = new Api.PeerChannel({ channelId: id });
          break;
        case 'group':
          peerRef = new Api.PeerChat({ chatId: id });
          break;
        default:
          peerRef = new Api.PeerUser({ userId: id });
      }
      entity = await client.getInputEntity(peerRef);
    } catch {
      // 缓存未命中，fallback 到手动构建（需要有效 accessHash）
      entity = resolveInputPeer(peerId, peerType, accessHash);
    }

    const photo = await client.downloadProfilePhoto(entity);
    if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
      return null;
    }
    return Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
  } catch (err) {
    console.error(`avatar download failed [peerId=${peerId}]:`, err);
    return null;
  }
}

export function clearPhotoCache(session: string): void {
  photoCache.delete(sessionCacheKey(session));
}

export async function getProfilePhotoBase64(
  session: string,
): Promise<string | undefined> {
  const { buffer } = await getProfilePhoto(session);
  return buffer ? bufferToDataUri(buffer) : undefined;
}
