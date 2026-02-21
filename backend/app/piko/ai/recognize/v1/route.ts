import { NextRequest, NextResponse } from 'next/server';

import { recognizePayment } from '@/lib/services/tools/recognize-payment';
import type { RecognizeRequest, RecognizeResponse } from '@/types/expense';
import type { ApiResponse } from '@/types/base';

/**
 * POST /piko/ai/recognize/v1
 *
 * [模块 2B] 接收 base64 图片，调用 Gemini Vision 识别消费信息。
 *
 * 请求体: { image: string (base64), mimeType: string }
 * 响应体: ApiResponse<RecognizeResponse>
 */
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ApiResponse<RecognizeResponse>>> {
  const t0 = Date.now();

  let body: RecognizeRequest;
  try {
    body = (await request.json()) as RecognizeRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.image || typeof body.image !== 'string') {
    return NextResponse.json(
      { success: false, error: 'image (base64) is required' },
      { status: 400 },
    );
  }

  if (!body.mimeType || typeof body.mimeType !== 'string') {
    return NextResponse.json(
      { success: false, error: 'mimeType is required' },
      { status: 400 },
    );
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(body.mimeType)) {
    return NextResponse.json(
      {
        success: false,
        error: `Unsupported mimeType. Allowed: ${allowedMimeTypes.join(', ')}`,
      },
      { status: 400 },
    );
  }

  console.log(
    `[Recognize] ← 收到识别请求 (${body.mimeType}, ${Math.round(body.image.length / 1024)}KB base64)`,
  );

  try {
    const result = await recognizePayment(body.image, body.mimeType);
    const elapsed = Date.now() - t0;

    console.log(
      `[Recognize] ✓ 识别完成 (${elapsed}ms) → ¥${result.amount} ${result.merchant} [${result.category}] 置信度:${result.confidence}`,
    );

    return NextResponse.json({
      success: true,
      data: { result },
    });
  } catch (err) {
    const elapsed = Date.now() - t0;
    const message =
      err instanceof Error ? err.message : 'Unknown recognition error';
    console.error(`[Recognize] ✗ 识别失败 (${elapsed}ms) →`, message);

    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
