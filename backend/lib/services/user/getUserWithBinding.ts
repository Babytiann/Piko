import { eq } from 'drizzle-orm';
import { db, users, telegramBindings } from '@/db';

export async function getUserWithBinding(userId: string): Promise<{
  id: string;
  nickname: string | null;
  avatarUrl: string | null;
  telegramBinding: {
    sessionString: string;
    telegramUserId: bigint;
    firstName: string | null;
    username: string | null;
    phone: string | null;
    createdAt: Date;
  } | null;
} | null> {
  const [user] = await db
    .select({
      id: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return null;

  const [binding] = await db
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
    .limit(1);

  return {
    ...user,
    telegramBinding: binding ?? null,
  };
}
