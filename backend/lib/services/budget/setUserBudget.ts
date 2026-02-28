import { createId } from '@paralleldrive/cuid2';

import { eq } from 'drizzle-orm';

import { db, userBudgets } from '../../../db/index.js';

/**
 * 计算指定月份包含的周数（以周一为一周起点，跨月的周算入当月）。
 */
function getWeeksInMonth(year: number, month: number): number {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDay = first.getDay() || 7; // Mon=1 ... Sun=7
  const totalDays = last.getDate();
  return Math.ceil((totalDays + firstDay - 1) / 7);
}

/**
 * 设置用户月预算，同时计算并存储周预算（monthlyBudget / 当月周数）。
 */
export async function setUserBudget(
  userId: string,
  monthlyBudget: number,
): Promise<{ monthlyBudget: number; weeklyBudget: number }> {
  const monthly = Math.max(0, Number(monthlyBudget));
  if (!Number.isFinite(monthly)) {
    throw new Error('monthlyBudget must be a finite number');
  }

  const now = new Date();
  const weeks = getWeeksInMonth(now.getFullYear(), now.getMonth());
  const weekly = Math.round((monthly / weeks) * 100) / 100;

  const [existing] = await db
    .select({ id: userBudgets.id })
    .from(userBudgets)
    .where(eq(userBudgets.userId, userId))
    .limit(1);

  const monthlyValue = monthly.toFixed(2);
  const weeklyValue = weekly.toFixed(2);

  if (existing) {
    await db
      .update(userBudgets)
      .set({
        monthlyBudget: monthlyValue,
        weeklyBudget: weeklyValue,
        updatedAt: new Date(),
      })
      .where(eq(userBudgets.userId, userId));
  } else {
    await db.insert(userBudgets).values({
      id: createId(),
      userId,
      monthlyBudget: monthlyValue,
      weeklyBudget: weeklyValue,
    });
  }

  return { monthlyBudget: monthly, weeklyBudget: weekly };
}
