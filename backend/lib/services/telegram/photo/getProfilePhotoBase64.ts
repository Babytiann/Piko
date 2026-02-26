import { getProfilePhoto } from './getProfilePhoto';
import { bufferToDataUri } from './cache';

export async function getProfilePhotoBase64(
  session: string,
): Promise<string | undefined> {
  const { buffer } = await getProfilePhoto(session);
  return buffer ? bufferToDataUri(buffer) : undefined;
}
