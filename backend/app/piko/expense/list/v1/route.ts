import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { listExpenses } from '@/lib/services/expense';

/**
 * POST /piko/expense/list/v1
 *
 * 查询用户消费记录列表（分页 + 日期过滤）。
 *
 * Body: { page?: number, pageSize?: number, startDate?: string, endDate?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = (await request.json()) as Record<string, unknown>;

    const result = await listExpenses(userId, {
      page: body.page as number | undefined,
      pageSize: body.pageSize as number | undefined,
      startDate: body.startDate as string | undefined,
      endDate: body.endDate as string | undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to list expenses';
    console.error('[Expense list] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
