import { eq, and } from 'drizzle-orm';
import { db, expenses } from '@/db';
import { deleteObject } from '@/lib/r2';

export async function deleteExpense(
  userId: string,
  expenseId: string,
): Promise<boolean> {
  const [expense] = await db
    .select({ id: expenses.id, imageKey: expenses.imageKey })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
    .limit(1);

  if (!expense) return false;

  if (expense.imageKey) {
    try {
      await deleteObject(expense.imageKey);
    } catch (err) {
      console.warn('[Expense] Failed to delete R2 image:', err);
    }
  }

  await db
    .delete(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)));

  return true;
}
