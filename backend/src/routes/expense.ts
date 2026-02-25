/**
 * Expense 路由
 *   POST /piko/expense/upload/v1
 *   POST /piko/expense/list/v1
 */

import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '@/lib/auth';
import {
  createExpense,
  listExpenses,
  type CreateExpenseInput,
} from '@/lib/services/expense';
import { recognizePayment } from '@/lib/services/tools/recognize-payment';

export const expenseRoutes = new Hono();

// ── POST /upload/v1 ──────────────────────────────────────────────────────────
expenseRoutes.post('/upload/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as Record<string, unknown>;

    const source = (body.source as string) ?? 'manual';
    const mimeType = (body.mime_type as string) ?? 'image/jpeg';

    let recognizeResult = null;
    if (body.image && !body.amount) {
      recognizeResult = await recognizePayment(body.image as string, mimeType);
    }

    const input: CreateExpenseInput = {
      amount: (body.amount as number) ?? recognizeResult?.amount ?? 0,
      merchant: (body.merchant as string) ?? recognizeResult?.merchant,
      category:
        (body.category as string) ?? recognizeResult?.category ?? '其他',
      date:
        (body.date as string) ??
        recognizeResult?.date ??
        new Date().toISOString().slice(0, 10),
      items: (body.items as string[]) ?? recognizeResult?.items,
      confidence: (body.confidence as number) ?? recognizeResult?.confidence,
      source: source as 'camera' | 'album' | 'manual',
      imageBase64: body.image as string | undefined,
      imageMimeType: mimeType,
      rawResult: recognizeResult ?? undefined,
    };

    const expense = await createExpense(userId, input);

    return c.json({
      success: true,
      data: {
        id: expense.id,
        amount: Number(expense.amount),
        merchant: expense.merchant,
        category: expense.category,
        date: expense.date.toISOString(),
        source: expense.source,
        image_url: expense.imageUrl,
        created_at: expense.createdAt.toISOString(),
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to upload expense';
    console.error('[Expense upload] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

// ── POST /list/v1 ────────────────────────────────────────────────────────────
expenseRoutes.post('/list/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as Record<string, unknown>;

    const result = await listExpenses(userId, {
      page: (body.page as number) ?? undefined,
      pageSize:
        (body.page_size as number) ?? (body.pageSize as number | undefined),
      startDate:
        (body.start_date as string) ?? (body.startDate as string | undefined),
      endDate:
        (body.end_date as string) ?? (body.endDate as string | undefined),
    });

    return c.json({
      success: true,
      data: {
        expenses: result.expenses.map((e) => ({
          id: e.id,
          amount: e.amount,
          merchant: e.merchant,
          category: e.category,
          date: e.date,
          items: e.items,
          source: e.source,
          image_url: e.imageUrl,
          confidence: e.confidence,
          created_at: e.createdAt,
        })),
        total: result.total,
        page: result.page,
        page_size: result.pageSize,
        total_pages: result.totalPages,
      },
    });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to list expenses';
    console.error('[Expense list] error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
