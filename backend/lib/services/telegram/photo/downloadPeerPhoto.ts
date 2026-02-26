import { Api } from 'telegram';
import { getPooledClient, resolveInputPeer } from '@/lib/telegram';

export async function downloadPeerPhoto(
  session: string,
  peerId: string,
  peerType: string,
  accessHash: string,
): Promise<Buffer | null> {
  const client = await getPooledClient(session);

  try {
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
