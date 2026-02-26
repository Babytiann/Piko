const PHOTO_CACHE_TTL = 5 * 60 * 1000;
interface PhotoCacheEntry {
  buffer: Buffer;
  timestamp: number;
}
const photoCache = new Map<string, PhotoCacheEntry>();

export function sessionCacheKey(session: string): string {
  return session.slice(0, 32);
}

export function bufferToDataUri(buf: Buffer): string {
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

export function getCachedPhoto(
  session: string,
): { buffer: Buffer; hasPhoto: true } | null {
  const key = sessionCacheKey(session);
  const cached = photoCache.get(key);
  if (cached && Date.now() - cached.timestamp < PHOTO_CACHE_TTL) {
    return { buffer: cached.buffer, hasPhoto: true };
  }
  return null;
}

export function setCachedPhoto(session: string, buffer: Buffer): void {
  photoCache.set(sessionCacheKey(session), { buffer, timestamp: Date.now() });
}

export function clearPhotoCache(session: string): void {
  photoCache.delete(sessionCacheKey(session));
}
