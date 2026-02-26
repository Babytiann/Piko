import { db, users } from '@/db';

export async function ensureUser(userId: string): Promise<void> {
  await db
    .insert(users)
    .values({
      id: userId,
      nickname: '新用户',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: users.id });
}
