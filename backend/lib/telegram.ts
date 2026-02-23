import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';

const API_ID = Number(process.env.TELEGRAM_API_ID);
const API_HASH = process.env.TELEGRAM_API_HASH!;

if (!API_ID || !API_HASH) {
  console.warn(
    'TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in .env.local',
  );
}

// ---------------------------------------------------------------------------
// Global stores (survive Next.js dev-mode hot reloads via globalThis)
// ---------------------------------------------------------------------------

interface PooledClient {
  client: TelegramClient;
  lastUsed: number;
}

const globalForTelegram = globalThis as unknown as {
  __pendingTelegramClients?: Map<string, TelegramClient>;
  __clientPool?: Map<string, PooledClient>;
  __clientPoolTimer?: ReturnType<typeof setInterval>;
};

// Pending clients for the login flow
if (!globalForTelegram.__pendingTelegramClients) {
  globalForTelegram.__pendingTelegramClients = new Map<
    string,
    TelegramClient
  >();
}
const pendingClients = globalForTelegram.__pendingTelegramClients;

// ---------------------------------------------------------------------------
// Authenticated client pool
// ---------------------------------------------------------------------------

/** Time-to-live for idle pooled clients (10 minutes). */
const POOL_TTL = 10 * 60 * 1000;
/** Maximum number of concurrent clients in the pool. */
const POOL_MAX_SIZE = 20;
/** Interval for sweeping expired clients (60 seconds). */
const POOL_SWEEP_INTERVAL = 60 * 1000;

if (!globalForTelegram.__clientPool) {
  globalForTelegram.__clientPool = new Map<string, PooledClient>();
}
const clientPool = globalForTelegram.__clientPool;

/** Use first 32 chars of the session string as the pool key. */
function poolKey(sessionString: string): string {
  return sessionString.slice(0, 32);
}

/** Evict the least-recently-used client to make room. */
function evictLRU(): void {
  let oldestKey: string | null = null;
  let oldestTime = Infinity;
  for (const [key, entry] of clientPool) {
    if (entry.lastUsed < oldestTime) {
      oldestTime = entry.lastUsed;
      oldestKey = key;
    }
  }
  if (oldestKey) {
    const entry = clientPool.get(oldestKey);
    clientPool.delete(oldestKey);
    if (entry) {
      disconnectClient(entry.client);
    }
  }
}

/** Remove expired clients from the pool. */
function sweepPool(): void {
  try {
    const now = Date.now();
    for (const [key, entry] of clientPool) {
      if (now - entry.lastUsed > POOL_TTL) {
        clientPool.delete(key);
        disconnectClient(entry.client);
      }
    }
  } catch {
    // 防止 sweep 期间 libuv handle 竞态导致进程崩溃
  }
}

// Start the periodic sweep (only once globally)
if (!globalForTelegram.__clientPoolTimer) {
  globalForTelegram.__clientPoolTimer = setInterval(
    sweepPool,
    POOL_SWEEP_INTERVAL,
  );
  // Allow the process to exit even if the timer is active
  if (globalForTelegram.__clientPoolTimer?.unref) {
    globalForTelegram.__clientPoolTimer.unref();
  }
}

/**
 * Get a pooled (long-lived) authenticated TelegramClient for a session.
 * Creates and connects a new client only when no usable one exists in the pool.
 */
export async function getPooledClient(
  sessionString: string,
): Promise<TelegramClient> {
  const key = poolKey(sessionString);
  const existing = clientPool.get(key);

  if (existing) {
    // Reconnect if the connection dropped
    if (!existing.client.connected) {
      // 把旧 client 从 pool 先移除，延迟断连（防止 libuv UV_HANDLE_CLOSING 竞态）
      clientPool.delete(key);
      disconnectClient(existing.client);
    } else {
      existing.lastUsed = Date.now();
      return existing.client;
    }
  }

  // Evict LRU if pool is full
  if (clientPool.size >= POOL_MAX_SIZE) {
    evictLRU();
  }

  const client = createClient(sessionString);
  await client.connect();
  clientPool.set(key, { client, lastUsed: Date.now() });
  return client;
}

/**
 * Remove and disconnect a pooled client by session string.
 * Used when the session is intentionally invalidated (e.g. unbind / logout).
 */
export async function removePooledClient(sessionString: string): Promise<void> {
  const key = poolKey(sessionString);
  const entry = clientPool.get(key);
  if (entry) {
    clientPool.delete(key);
    disconnectClient(entry.client); // 延迟断连，避免 libuv 竞态
  }
}

/**
 * Create a new TelegramClient with an optional existing session string.
 */
export function createClient(sessionString = ''): TelegramClient {
  const session = new StringSession(sessionString);
  return new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
    autoReconnect: false, // 禁掉 GramJS 内部重连定时器，避免 libuv handle 竞态
  });
}

/**
 * Get an existing pending client for a phone number (used by sign-in to
 * reuse the same client that sent the code).
 */
export function getPendingClient(
  phoneNumber: string,
): TelegramClient | undefined {
  return pendingClients.get(phoneNumber);
}

/**
 * Create a fresh pending client for a phone number (used by send-code).
 * Always destroys any existing client first to avoid stale session/connection issues.
 */
export async function createFreshPendingClient(
  phoneNumber: string,
): Promise<TelegramClient> {
  // Clean up any existing client for this phone number
  const existing = pendingClients.get(phoneNumber);
  if (existing) {
    pendingClients.delete(phoneNumber);
    disconnectClient(existing);
  }

  const client = createClient();
  await client.connect();
  pendingClients.set(phoneNumber, client);
  return client;
}

/**
 * Get or create a pending client for a phone number (used during login flow).
 * Reuses existing client if available (for sign-in after send-code).
 */
export async function getOrCreatePendingClient(
  phoneNumber: string,
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
  if (!client) return '';
  return (client.session as StringSession).save();
}

/**
 * Create an authenticated client from a saved session string.
 * Used for all post-login API calls (getDialogs, getMessages, etc.)
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
 * This avoids the entity cache lookup issue with fresh clients.
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
      // Supergroups are technically Channels with megagroup=true.
      // They carry a non-zero accessHash, whereas regular groups do not.
      if (accessHash && accessHash !== '0') {
        return new Api.InputPeerChannel({ channelId: id, accessHash: hash });
      }
      return new Api.InputPeerChat({ chatId: id });
  }
}

/**
 * Safely disconnect a client, swallowing errors.
 *
 * 延迟 500 ms 后再实际断开：GramJS 在 Windows 上通过 uv_async_t 与 worker 线程
 * 通信，立即调用 disconnect() 会把 libuv handle 标记为 CLOSING，但 worker
 * 可能仍有 pending 的 uv_async_send，导致 C 层断言崩溃（UV_HANDLE_CLOSING）。
 * 短暂延迟让 worker 先跑完，彻底规避竞态。
 */
export function disconnectClient(client: TelegramClient): void {
  setTimeout(() => {
    client.disconnect().catch(() => {});
  }, 500);
}
