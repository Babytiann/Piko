import { eq, and, gte, lte, desc, count } from 'drizzle-orm';

import { db, expenses } from '../../../db/index.js';
import { ExpenseListParams } from './types.js';

export async function listExpenses(
  userId: string,
  params: ExpenseListParams,
): Promise<{
  expenses: Array<{
    id: string;
    amount: number;
    merchant: string | null;
    category: string;
    date: string;
    items: string[] | null;
    source: string;
    imageUrl: string | null;
    confidence: number | null;
    createdAt: string;
  }>;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const offset = (page - 1) * pageSize;

  const conditions = [eq(expenses.userId, userId)];
  if (params.startDate) {
    conditions.push(gte(expenses.date, new Date(params.startDate)));
  }
  if (params.endDate) {
    conditions.push(lte(expenses.date, new Date(params.endDate)));
  }

  const where = and(...conditions);

  const [rows, [countRow]] = await Promise.all([
    db
      .select()
      .from(expenses)
      .where(where)
      .orderBy(desc(expenses.date))
      .limit(pageSize)
      .offset(offset),
    db.select({ total: count() }).from(expenses).where(where),
  ]);

  const total = countRow?.total ?? 0;

  return {
    expenses: rows.map((e) => ({
      id: e.id,
      amount: Number(e.amount),
      merchant: e.merchant,
      category: e.category,
      date: e.date.toISOString(),
      items: (e.items as string[] | null) ?? null,
      source: e.source,
      imageUrl: e.imageUrl,
      confidence: e.confidence,
      createdAt: e.createdAt.toISOString(),
    })),
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}
