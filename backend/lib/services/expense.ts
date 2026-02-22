import { eq, and, gte, lte, desc, count, sql } from 'drizzle-orm';
import { db, expenses } from '@/db';
import { uploadImage, deleteObject } from '@/lib/r2';
import { createId } from '@paralleldrive/cuid2';
import type { RecognizeResult } from '@/types/expense';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateExpenseInput {
  /** Gemini 识别或用户手动输入的消费数据 */
  amount: number;
  merchant?: string;
  category: string;
  date: string; // ISO 8601
  items?: string[];
  confidence?: number;
  source: 'camera' | 'album' | 'manual';
  /** Base64 编码的图片（可选） */
  imageBase64?: string;
  imageMimeType?: string;
  /** Gemini 原始识别结果（可选） */
  rawResult?: RecognizeResult;
}

export interface ExpenseListParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

/**
 * 创建消费记录。若有图片则先上传到 R2。
 */
export async function createExpense(
  userId: string,
  input: CreateExpenseInput,
): Promise<{
  id: string;
  amount: number;
  merchant: string | null;
  category: string;
  date: Date;
  source: string;
  imageUrl: string | null;
  createdAt: Date;
}> {
  let imageUrl: string | null = null;
  let imageKey: string | null = null;

  // 上传图片到 R2（如果有的话）
  if (input.imageBase64 && input.imageMimeType) {
    const buffer = Buffer.from(input.imageBase64, 'base64');
    const ext = input.imageMimeType.split('/')[1] ?? 'jpg';
    imageKey = `expenses/${userId}/${Date.now()}.${ext}`;
    imageUrl = await uploadImage(buffer, imageKey, input.imageMimeType);
  }

  const [expense] = await db
    .insert(expenses)
    .values({
      id: createId(),
      userId,
      amount: input.amount.toString(),
      merchant: input.merchant ?? null,
      category: input.category,
      date: new Date(input.date),
      items: input.items ?? null,
      confidence: input.confidence ?? null,
      source: input.source,
      imageUrl,
      imageKey,
      rawResult: input.rawResult ?? null,
      createdAt: new Date(),
    })
    .returning();

  if (!expense) {
    throw new Error('消费记录创建失败');
  }

  return {
    id: expense.id,
    amount: Number(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    date: expense.date,
    source: expense.source,
    imageUrl: expense.imageUrl,
    createdAt: expense.createdAt,
  };
}

/**
 * 查询用户消费记录列表（分页 + 日期过滤）。
 */
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

  // 构建日期过滤条件
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

/**
 * 获取单条消费记录详情（校验用户权限）。
 */
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

/**
 * 删除消费记录（同时清理 R2 图片）。
 * @returns true 表示删除成功，false 表示记录不存在
 */
export async function deleteExpense(
  userId: string,
  expenseId: string,
): Promise<boolean> {
  // 先查出 imageKey，再删除记录
  const [expense] = await db
    .select({ id: expenses.id, imageKey: expenses.imageKey })
    .from(expenses)
    .where(and(eq(expenses.id, expenseId), eq(expenses.userId, userId)))
    .limit(1);

  if (!expense) return false;

  // 清理 R2 图片（失败不影响删除逻辑）
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
