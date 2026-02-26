import { eq, and } from 'drizzle-orm';

import { db, expenses } from '../../../db/index.js';

export async function getExpenseDetail(
  userId: string,
  expenseId: string,
): Promise<{
  id: string;
  amount: number;
  merchant: string | null;
  category: string;
  date: string;
  items: string[] | null;
  source: string;
  imageUrl: string | null;
  confidence: number | null;
  rawResult: unknown;
  createdAt: string;
} | null> {
  const [expense] = await db
    .select()
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
    .limit(1);

  if (!expense) return null;

  return {
    id: expense.id,
    amount: Number(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    date: expense.date.toISOString(),
    items: (expense.items as string[] | null) ?? null,
    source: expense.source,
    imageUrl: expense.imageUrl,
    confidence: expense.confidence,
    rawResult: expense.rawResult,
    createdAt: expense.createdAt.toISOString(),
  };
}
