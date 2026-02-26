import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';

import { createClient, disconnectClient } from './client.js';

const globalForTelegram = globalThis as unknown as {
  __pendingTelegramClients?: Map<string, TelegramClient>;
};

if (!globalForTelegram.__pendingTelegramClients) {
  globalForTelegram.__pendingTelegramClients = new Map<
    string,
    TelegramClient
  >();
}
const pendingClients = globalForTelegram.__pendingTelegramClients;

export function getPendingClient(
  phoneNumber: string,
): TelegramClient | undefined {
  return pendingClients.get(phoneNumber);
}

export async function createFreshPendingClient(
  phoneNumber: string,
): Promise<TelegramClient> {
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

export function removePendingClient(phoneNumber: string): void {
  const client = pendingClients.get(phoneNumber);
  if (client) {
    pendingClients.delete(phoneNumber);
  }
}

export function getPendingClientSession(phoneNumber: string): string {
  const client = pendingClients.get(phoneNumber);
  if (!client) return '';
  return (client.session as StringSession).save();
}
