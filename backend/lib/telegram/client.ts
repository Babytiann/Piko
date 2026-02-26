import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { API_ID, API_HASH } from './constants';

/**
 * Create a new TelegramClient with an optional existing session string.
 */
export function createClient(sessionString = ''): TelegramClient {
  const session = new StringSession(sessionString);
  return new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
    autoReconnect: false,
  });
}

/**
 * Create an authenticated client from a saved session string.
 */
export async function createAuthenticatedClient(
  sessionString: string,
): Promise<TelegramClient> {
  const client = createClient(sessionString);
  await client.connect();
  return client;
}

/**
 * Resolve a chat ID + type + accessHash into an InputPeer object.
 */
export function resolveInputPeer(
  chatId: string,
  chatType: string,
  accessHash: string,
): Api.TypeInputPeer {
  const id = BigInt(chatId) as unknown as Api.long;
  const hash = BigInt(accessHash || '0') as unknown as Api.long;

  switch (chatType) {
    case 'user':
      return new Api.InputPeerUser({ userId: id, accessHash: hash });
    case 'channel':
      return new Api.InputPeerChannel({ channelId: id, accessHash: hash });
    case 'group':
    default:
      if (accessHash && accessHash !== '0') {
        return new Api.InputPeerChannel({ channelId: id, accessHash: hash });
      }
      return new Api.InputPeerChat({ chatId: id });
  }
}

/**
 * Safely disconnect a client, swallowing errors.
 * Delays 500ms to avoid libuv UV_HANDLE_CLOSING race.
 */
export function disconnectClient(client: TelegramClient): void {
  setTimeout(() => {
    client.disconnect().catch(() => {});
  }, 500);
}

export { StringSession };
