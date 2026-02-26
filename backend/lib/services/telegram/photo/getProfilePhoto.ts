import { getPooledClient } from '../../../telegram/index.js';
import { getCachedPhoto, setCachedPhoto } from './cache.js';

export async function getProfilePhoto(
  session: string,
): Promise<{ buffer: Buffer | null; hasPhoto: boolean }> {
  const cached = getCachedPhoto(session);
  if (cached) return { buffer: cached.buffer, hasPhoto: true };

  const client = await getPooledClient(session);
  const photo = await client.downloadProfilePhoto('me');
  if (!photo || (Buffer.isBuffer(photo) && photo.length === 0)) {
    return { buffer: null, hasPhoto: false };
  }

  const buf = Buffer.isBuffer(photo) ? photo : Buffer.from(photo);
  setCachedPhoto(session, buf);
  return { buffer: buf, hasPhoto: true };
}
