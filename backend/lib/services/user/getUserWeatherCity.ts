import { eq } from 'drizzle-orm';

import { db, users } from '../../../db/index.js';

export async function getUserWeatherCity(
  userId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ weatherCity: users.weatherCity })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.weatherCity ?? null;
}
