import type { TelegramClient } from 'telegram';
import { createClient, disconnectClient } from './client';
import { POOL_TTL, POOL_MAX_SIZE, POOL_SWEEP_INTERVAL } from './constants';

interface PooledClient {
  client: TelegramClient;
  lastUsed: number;
}

const globalForTelegram = globalThis as unknown as {
  __clientPool?: Map<string, PooledClient>;
  __clientPoolTimer?: ReturnType<typeof setInterval>;
};

if (!globalForTelegram.__clientPool) {
  globalForTelegram.__clientPool = new Map<string, PooledClient>();
}
const clientPool = globalForTelegram.__clientPool;

function poolKey(sessionString: string): string {
  return sessionString.slice(0, 32);
}

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

if (!globalForTelegram.__clientPoolTimer) {
  globalForTelegram.__clientPoolTimer = setInterval(
    sweepPool,
    POOL_SWEEP_INTERVAL,
  );
  if (globalForTelegram.__clientPoolTimer?.unref) {
    globalForTelegram.__clientPoolTimer.unref();
  }
}

export async function getPooledClient(
  sessionString: string,
): Promise<TelegramClient> {
  const key = poolKey(sessionString);
  const existing = clientPool.get(key);

  if (existing) {
    if (!existing.client.connected) {
      clientPool.delete(key);
      disconnectClient(existing.client);
    } else {
      existing.lastUsed = Date.now();
      return existing.client;
    }
  }

  if (clientPool.size >= POOL_MAX_SIZE) {
    evictLRU();
  }

  const client = createClient(sessionString);
  await client.connect();
  clientPool.set(key, { client, lastUsed: Date.now() });
  return client;
}

export async function removePooledClient(sessionString: string): Promise<void> {
  const key = poolKey(sessionString);
  const entry = clientPool.get(key);
  if (entry) {
    clientPool.delete(key);
    disconnectClient(entry.client);
  }
}
