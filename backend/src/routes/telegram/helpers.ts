import { Api } from 'telegram';

import type { TelegramUser } from '../../../types/telegram-login.js';

export function userPayload(user: Api.TypeUser): TelegramUser {
  return {
    id: user.id?.toString(),
    first_name: (user as Api.User).firstName ?? '',
    last_name: (user as Api.User).lastName ?? '',
    username: (user as Api.User).username ?? '',
    phone: (user as Api.User).phone ?? '',
  };
}
