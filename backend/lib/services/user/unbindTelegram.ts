import { eq } from 'drizzle-orm';

import { db, telegramBindings } from '../../../db/index.js';

export async function unbindTelegram(userId: string): Promise<boolean> {
  const result = await db
    .delete(telegramBindings)
    .where(eq(telegramBindings.userId, userId))
    .returning({ id: telegramBindings.id });

  return result.length > 0;
}
