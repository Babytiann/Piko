import { eq } from 'drizzle-orm';

import {
  db,
  expenses,
  userBudgets,
  aiConversations,
} from '../../../db/index.js';

export interface ClearUserDataResult {
  expenses: number;
  conversations: number;
  budget: number;
}

/**
 * 清除用户业务数据，保留账号与登录态。
 * 删除：消费记录、AI 对话（级联消息）、预算记录。
 */
export async function clearUserData(
  userId: string,
): Promise<ClearUserDataResult> {
  const [expenseResult, budgetResult, convResult] = await Promise.all([
    db.delete(expenses).where(eq(expenses.userId, userId)),
    db.delete(userBudgets).where(eq(userBudgets.userId, userId)),
    db.delete(aiConversations).where(eq(aiConversations.userId, userId)),
  ]);

  return {
    expenses: expenseResult.rowCount ?? 0,
    conversations: convResult.rowCount ?? 0,
    budget: budgetResult.rowCount ?? 0,
  };
}
