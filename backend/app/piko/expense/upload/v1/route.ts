import { NextRequest, NextResponse } from 'next/server';
import { getUserId } from '@/lib/auth';
import { createExpense, type CreateExpenseInput } from '@/lib/services/expense';
import { recognizePayment } from '@/lib/services/tools/recognize-payment';

/**
 * POST /piko/expense/upload/v1
 *
 * 上传消费记录。支持三种模式：
 * 1. 手动输入：直接传消费数据
 * 2. 已识别：前端已调用 recognize，传结果 + 图片
 * 3. 上传识别：传图片，后端先识别再存储
 *
 * Body: {
 *   source: "camera" | "album" | "manual",
 *   // 手动输入或已识别时传：
 *   amount?: number,
 *   merchant?: string,
 *   category?: string,
 *   date?: string,
 *   items?: string[],
 *   confidence?: number,
 *   // 有图片时传：
 *   image?: string (base64),
 *   mimeType?: string,
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const userId = getUserId(request);
    const body = (await request.json()) as Record<string, unknown>;

    const source = (body.source as string) ?? 'manual';

    // 若有图片但无金额，先调用 Gemini 识别
    let recognizeResult = null;
    if (body.image && !body.amount) {
      recognizeResult = await recognizePayment(
        body.image as string,
        (body.mimeType as string) ?? 'image/jpeg',
      );
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
      imageMimeType: body.mimeType as string | undefined,
      rawResult: recognizeResult ?? undefined,
    };

    const expense = await createExpense(userId, input);

    return NextResponse.json({
      success: true,
      data: {
        id: expense.id,
        amount: Number(expense.amount),
        merchant: expense.merchant,
        category: expense.category,
        date: expense.date.toISOString(),
        source: expense.source,
        imageUrl: expense.imageUrl,
        createdAt: expense.createdAt.toISOString(),
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : 'Failed to upload expense';
    console.error('[Expense upload] error:', error);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
