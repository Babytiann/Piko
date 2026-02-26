import { eq } from 'drizzle-orm';

import { db, telegramBindings } from '../../../db/index.js';

export async function getTelegramSession(
  userId: string,
): Promise<string | null> {
  const [binding] = await db
    .select({ sessionString: telegramBindings.sessionString })
    .from(telegramBindings)
    .where(eq(telegramBindings.userId, userId))
    .limit(1);

  return binding?.sessionString ?? null;
}
