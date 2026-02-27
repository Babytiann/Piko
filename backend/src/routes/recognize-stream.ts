import { Hono } from 'hono';
import { streamSSE } from 'hono/streaming';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';
import { recognizePayment } from '../../lib/services/tools/recognize-payment.js';
import {
  createExpense,
  type CreateExpenseInput,
} from '../../lib/services/expense/index.js';

export const recognizeStreamRoutes = new Hono();

recognizeStreamRoutes.post('/recognize-stream/v1', async (c) => {
  let userId: string;
  try {
    userId = await getUserId(c.req.raw);
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    return c.json({ success: false, error: 'Auth failed' }, 500);
  }

  const body = (await c.req.json()) as Record<string, unknown>;
  const imageBase64 = body.image as string | undefined;
  const mimeType = (body.mime_type as string) ?? 'image/jpeg';
  const source = (body.source as string) ?? 'camera';

  if (!imageBase64) {
    return c.json({ success: false, error: 'Missing image' }, 400);
  }

  return streamSSE(c, async (stream) => {
    try {
      await stream.writeSSE({
        event: 'progress',
        data: JSON.stringify({
          step: 'uploading',
          progress: 15,
          message: '正在上传图片...',
        }),
      });

      await stream.writeSSE({
        event: 'progress',
        data: JSON.stringify({
          step: 'analyzing',
          progress: 35,
          message: 'AI 正在分析消费信息...',
        }),
      });

      const recognizeResult = await recognizePayment(imageBase64, mimeType);

      await stream.writeSSE({
        event: 'progress',
        data: JSON.stringify({
          step: 'parsing',
          progress: 85,
          message: '正在整理识别结果...',
        }),
      });

      const input: CreateExpenseInput = {
        amount: recognizeResult.amount,
        merchant: recognizeResult.merchant,
        category: recognizeResult.category,
        date: recognizeResult.date,
        items: recognizeResult.items,
        confidence: recognizeResult.confidence,
        source: source as 'camera' | 'album' | 'manual',
        imageBase64,
        imageMimeType: mimeType,
        rawResult: recognizeResult,
      };

      const expense = await createExpense(userId, input);

      await stream.writeSSE({
        event: 'complete',
        data: JSON.stringify({
          progress: 100,
          result: recognizeResult,
          expense_id: expense.id,
          image_url: expense.imageUrl,
        }),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '识别失败，请重试';
      await stream.writeSSE({
        event: 'error',
        data: JSON.stringify({ message }),
      });
    }
  });
});
