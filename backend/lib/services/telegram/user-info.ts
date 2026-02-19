import { Api } from 'telegram';
import parsePhoneNumber from 'libphonenumber-js';

import { getPooledClient } from '@/lib/telegram';
import type { TelegramUserInfo } from '@/types/telegram';

export async function getUserInfo(session: string): Promise<TelegramUserInfo> {
  const client = await getPooledClient(session);
  const me = await client.getMe();

  if (!(me instanceof Api.User)) {
    throw new Error('getMe() did not return a User entity');
  }

  const parsed = me.phone ? parsePhoneNumber(`+${me.phone}`) : null;
  const processedPhone = parsed
    ? `+${parsed.countryCallingCode} ${parsed.nationalNumber}`
    : '';

  return {
    id: me.id.toString(),
    firstName: me.firstName ?? '',
    lastName: me.lastName ?? '',
    username: me.username ?? '',
    phone: processedPhone,
    hasPhoto: !!me.photo,
  };
}
