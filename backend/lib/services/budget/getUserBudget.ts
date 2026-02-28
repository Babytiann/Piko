import { eq } from 'drizzle-orm';

import { db, userBudgets } from '../../../db/index.js';

export interface UserBudgetResult {
  monthlyBudget: number;
  weeklyBudget: number;
}

/**
 * 获取用户预算（月预算 + 周预算），未设置则返回 null。
 */
export async function getUserBudget(
  userId: string,
): Promise<UserBudgetResult | null> {
  const [row] = await db
    .select({
      monthlyBudget: userBudgets.monthlyBudget,
      weeklyBudget: userBudgets.weeklyBudget,
    })
    .from(userBudgets)
    .where(eq(userBudgets.userId, userId))
    .limit(1);

  if (!row) return null;

  const monthly = Number(row.monthlyBudget);
  const weekly = Number(row.weeklyBudget);

  if (!Number.isFinite(monthly) || !Number.isFinite(weekly)) return null;

  return { monthlyBudget: monthly, weeklyBudget: weekly };
}
