import { Api } from 'telegram';
import parsePhoneNumber from 'libphonenumber-js';
import { getPooledClient } from '../../../telegram/index.js';
import type { TelegramUserInfo } from '../../../../types/telegram.js';
import { getUserInfoCache, setUserInfoCache } from './cache.js';

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
