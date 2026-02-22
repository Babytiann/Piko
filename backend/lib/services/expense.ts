import { prisma } from '@/lib/prisma';
import { uploadImage, deleteObject } from '@/lib/r2';
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
export async function createExpense(userId: string, input: CreateExpenseInput) {
  let imageUrl: string | undefined;
  let imageKey: string | undefined;

  // 上传图片到 R2（如果有的话）
  if (input.imageBase64 && input.imageMimeType) {
    const buffer = Buffer.from(input.imageBase64, 'base64');
    const ext = input.imageMimeType.split('/')[1] ?? 'jpg';
    imageKey = `expenses/${userId}/${Date.now()}.${ext}`;
    imageUrl = await uploadImage(buffer, imageKey, input.imageMimeType);
  }

  const expense = await prisma.expense.create({
    data: {
      userId,
      amount: input.amount,
      merchant: input.merchant,
      category: input.category,
      date: new Date(input.date),
      items: input.items ?? undefined,
      confidence: input.confidence,
      source: input.source,
      imageUrl,
      imageKey,
      rawResult: input.rawResult ? (input.rawResult as object) : undefined,
    },
  });

  return expense;
}

/**
 * 查询用户消费记录列表（分页 + 日期过滤）。
 */
export async function listExpenses(userId: string, params: ExpenseListParams) {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 20));
  const skip = (page - 1) * pageSize;

  const where: Record<string, unknown> = { userId };

  if (params.startDate || params.endDate) {
    const dateFilter: Record<string, Date> = {};
    if (params.startDate) dateFilter.gte = new Date(params.startDate);
    if (params.endDate) dateFilter.lte = new Date(params.endDate);
    where.date = dateFilter;
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    expenses: expenses.map((e: (typeof expenses)[number]) => ({
      id: e.id,
      amount: Number(e.amount),
      merchant: e.merchant,
      category: e.category,
      date: e.date.toISOString(),
      items: e.items as string[] | null,
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
 * 获取单条消费记录详情。
 */
export async function getExpenseDetail(userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) return null;

  return {
    id: expense.id,
    amount: Number(expense.amount),
    merchant: expense.merchant,
    category: expense.category,
    date: expense.date.toISOString(),
    items: expense.items as string[] | null,
    source: expense.source,
    imageUrl: expense.imageUrl,
    confidence: expense.confidence,
    rawResult: expense.rawResult,
    createdAt: expense.createdAt.toISOString(),
  };
}

/**
 * 删除消费记录（同时清理 R2 图片）。
 */
export async function deleteExpense(userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) return false;

  // 清理 R2 图片
  if (expense.imageKey) {
    try {
      await deleteObject(expense.imageKey);
    } catch (err) {
      console.warn('[Expense] Failed to delete R2 image:', err);
    }
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return true;
}
