import type { TelegramUserInfo } from '@/types/telegram';

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
