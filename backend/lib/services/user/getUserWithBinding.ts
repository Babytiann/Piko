import { eq } from 'drizzle-orm';

import { db, users, telegramBindings } from '../../../db/index.js';

export async function getUserWithBinding(userId: string): Promise<{
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  weatherCity: string | null;
  telegramBinding: {
    sessionString: string;
    telegramUserId: bigint;
    firstName: string | null;
    username: string | null;
    phone: string | null;
    createdAt: Date;
  } | null;
} | null> {
  const [userRows, bindingRows] = await Promise.all([
    db
      .select({
        id: users.id,
        nickname: users.nickname,
        avatarUrl: users.avatarUrl,
        weatherCity: users.weatherCity,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
    db
      .select({
        sessionString: telegramBindings.sessionString,
        telegramUserId: telegramBindings.telegramUserId,
        firstName: telegramBindings.firstName,
        username: telegramBindings.username,
        phone: telegramBindings.phone,
        createdAt: telegramBindings.createdAt,
      })
      .from(telegramBindings)
      .where(eq(telegramBindings.userId, userId))
      .limit(1),
  ]);

  const user = userRows[0];
  if (!user) return null;

  return {
    ...user,
    telegramBinding: bindingRows[0] ?? null,
  };
}
