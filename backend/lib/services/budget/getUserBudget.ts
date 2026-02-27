import { eq } from 'drizzle-orm';

import { db, userBudgets } from '../../../db/index.js';

/**
 * 获取用户设置的周预算，未设置则返回 null。
 */
export async function getUserBudget(userId: string): Promise<number | null> {
  const [row] = await db
    .select({ weeklyBudget: userBudgets.weeklyBudget })
    .from(userBudgets)
    .where(eq(userBudgets.userId, userId))
    .limit(1);

  if (!row) return null;
  const value = Number(row.weeklyBudget);
  return Number.isFinite(value) ? value : null;
}
