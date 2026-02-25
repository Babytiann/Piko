import { Api } from 'telegram';
import parsePhoneNumber from 'libphonenumber-js';

import { getPooledClient } from '@/lib/telegram';
import type { TelegramUserInfo } from '@/types/telegram';

// ---------------------------------------------------------------------------
// In-memory cache (5 min TTL, keyed by first 32 chars of session)
// ---------------------------------------------------------------------------

interface UserInfoCacheEntry {
  data: TelegramUserInfo;
  expireAt: number;
}

const USER_INFO_TTL = 5 * 60 * 1000;
const userInfoCache = new Map<string, UserInfoCacheEntry>();

function sessionKey(session: string): string {
  return session.slice(0, 32);
}

export function getUserInfoCache(session: string): TelegramUserInfo | null {
  const entry = userInfoCache.get(sessionKey(session));
  if (entry && Date.now() < entry.expireAt) return entry.data;
  return null;
}

export function setUserInfoCache(
  session: string,
  data: TelegramUserInfo,
): void {
  userInfoCache.set(sessionKey(session), {
    data,
    expireAt: Date.now() + USER_INFO_TTL,
  });
}

export async function getUserInfo(session: string): Promise<TelegramUserInfo> {
  const cached = getUserInfoCache(session);
  if (cached) return cached;

  const client = await getPooledClient(session);
  const me = await client.getMe();

  if (!(me instanceof Api.User)) {
    throw new Error('getMe() did not return a User entity');
  }

  const parsed = me.phone ? parsePhoneNumber(`+${me.phone}`) : null;
  const processedPhone = parsed
    ? `+${parsed.countryCallingCode} ${parsed.nationalNumber}`
    : '';

  const result: TelegramUserInfo = {
    id: me.id.toString(),
    first_name: me.firstName ?? '',
    last_name: me.lastName ?? '',
    username: me.username ?? '',
    phone: processedPhone,
    has_photo: !!me.photo,
  };

  setUserInfoCache(session, result);
  return result;
}
