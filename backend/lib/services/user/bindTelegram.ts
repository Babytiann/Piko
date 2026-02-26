import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

import { TelegramAlreadyBoundError } from './errors.js';
import { db, telegramBindings } from '../../../db/index.js';

export async function bindTelegram(
  userId: string,
  data: {
    telegramUserId: bigint;
    username?: string;
    firstName?: string;
    phone?: string;
    sessionString: string;
  },
): Promise<void> {
  const [existing] = await db
    .select({ userId: telegramBindings.userId })
    .from(telegramBindings)
    .where(eq(telegramBindings.telegramUserId, data.telegramUserId))
    .limit(1);

  if (existing) {
    if (existing.userId !== userId) {
      throw new TelegramAlreadyBoundError();
    }
    await db
      .update(telegramBindings)
      .set({
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        phone: data.phone ?? null,
        sessionString: data.sessionString,
        updatedAt: new Date(),
      })
      .where(eq(telegramBindings.userId, userId));
    return;
  }

  await db
    .insert(telegramBindings)
    .values({
      id: createId(),
      userId,
      telegramUserId: data.telegramUserId,
      username: data.username ?? null,
      firstName: data.firstName ?? null,
      phone: data.phone ?? null,
      sessionString: data.sessionString,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: telegramBindings.userId,
      set: {
        telegramUserId: data.telegramUserId,
        username: data.username ?? null,
        firstName: data.firstName ?? null,
        phone: data.phone ?? null,
        sessionString: data.sessionString,
        updatedAt: new Date(),
      },
    });
}
