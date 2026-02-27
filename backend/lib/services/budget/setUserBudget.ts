import { createId } from '@paralleldrive/cuid2';

import { eq } from 'drizzle-orm';

import { db, userBudgets } from '../../../db/index.js';

/**
 * 设置用户周预算。若已存在则更新，否则插入。
 * weeklyBudget 必须为正数。
 */
export async function setUserBudget(
  userId: string,
  weeklyBudget: number,
): Promise<number> {
  const amount = Math.max(0, Number(weeklyBudget));
  if (!Number.isFinite(amount)) {
    throw new Error('weeklyBudget must be a finite number');
  }

  const [existing] = await db
    .select({ id: userBudgets.id })
    .from(userBudgets)
    .where(eq(userBudgets.userId, userId))
    .limit(1);

  const value = amount.toFixed(2);

  if (existing) {
    await db
      .update(userBudgets)
      .set({ weeklyBudget: value, updatedAt: new Date() })
      .where(eq(userBudgets.userId, userId));
  } else {
    await db.insert(userBudgets).values({
      id: createId(),
      userId,
      weeklyBudget: value,
    });
  }

  return amount;
}
