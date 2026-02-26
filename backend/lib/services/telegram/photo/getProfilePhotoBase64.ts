import { getProfilePhoto } from './getProfilePhoto.js';
import { bufferToDataUri } from './cache.js';

export async function getProfilePhotoBase64(
  session: string,
): Promise<string | undefined> {
  const { buffer } = await getProfilePhoto(session);
  return buffer ? bufferToDataUri(buffer) : undefined;
}
