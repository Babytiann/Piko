import { eq } from 'drizzle-orm';

import { db, users } from '../../../db/index.js';

export async function updateUserProfile(
  userId: string,
  data: {
    nickname?: string;
    avatarUrl?: string;
    weatherCity?: string | null;
  },
): Promise<void> {
  const updateData: Partial<typeof users.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (data.nickname !== undefined) updateData.nickname = data.nickname;
  if (data.avatarUrl !== undefined) updateData.avatarUrl = data.avatarUrl;
  if (data.weatherCity !== undefined) updateData.weatherCity = data.weatherCity;

  await db.update(users).set(updateData).where(eq(users.id, userId));
}
