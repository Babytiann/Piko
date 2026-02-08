import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH!;

if (!API_ID || !API_HASH) {
  console.warn(
    "TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env.local"
  );
}

/**
 * In-memory store for active TelegramClient instances keyed by phone number.
 * Used during the login flow (send-code -> sign-in) where we need to reuse
 * the same client across multiple requests.
 */
const pendingClients = new Map<string, TelegramClient>();

/**
 * Create a new TelegramClient with an optional existing session string.
 */
export function createClient(sessionString = ""): TelegramClient {
  const session = new StringSession(sessionString);
  return new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
  });
}

/**
 * Get or create a pending client for a phone number (used during login flow).
 * The client is stored so that the same connection + auth state is reused
 * between sendCode and signIn calls.
 */
export async function getOrCreatePendingClient(
  phoneNumber: string
): Promise<TelegramClient> {
  let client = pendingClients.get(phoneNumber);
  if (client) {
    if (!client.connected) {
      await client.connect();
    }
    return client;
  }

  client = createClient();
  await client.connect();
  pendingClients.set(phoneNumber, client);
  return client;
}

/**
 * Remove a pending client (after successful login or cleanup).
 */
export function removePendingClient(phoneNumber: string): void {
  const client = pendingClients.get(phoneNumber);
  if (client) {
    pendingClients.delete(phoneNumber);
    // Don't disconnect — the session will be saved and reused
  }
}

/**
 * Get the current session string from a pending client.
 */
export function getPendingClientSession(phoneNumber: string): string {
  const client = pendingClients.get(phoneNumber);
  if (!client) return "";
  return (client.session as StringSession).save();
}

/**
 * Create an authenticated client from a saved session string.
 * Used for all post-login API calls (getDialogs, getMessages, etc.)
 */
export async function createAuthenticatedClient(
  sessionString: string
): Promise<TelegramClient> {
  const client = createClient(sessionString);
  await client.connect();
  return client;
}

/**
 * Safely disconnect a client, swallowing errors.
 */
export async function disconnectClient(
  client: TelegramClient
): Promise<void> {
  try {
    await client.disconnect();
  } catch {
    // ignore disconnect errors
  }
}
