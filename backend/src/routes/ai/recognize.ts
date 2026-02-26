import { Hono } from 'hono';
import { recognizePayment } from '@/lib/services/tools/recognize-payment';

export const recognizeRoutes = new Hono();

recognizeRoutes.post('/recognize/v1', async (c) => {
  const t0 = Date.now();

  let body: { image: string; mime_type: string };
  try {
    body = (await c.req.json()) as { image: string; mime_type: string };
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!body.image || typeof body.image !== 'string') {
    return c.json({ success: false, error: 'image (base64) is required' }, 400);
  }
  if (!body.mime_type || typeof body.mime_type !== 'string') {
    return c.json({ success: false, error: 'mime_type is required' }, 400);
  }

  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedMimeTypes.includes(body.mime_type)) {
    return c.json(
      {
        success: false,
        error: `Unsupported mimeType. Allowed: ${allowedMimeTypes.join(', ')}`,
      },
      400,
    );
  }

  console.log(
    `[Recognize] ← 收到识别请求 (${body.mime_type}, ${Math.round(body.image.length / 1024)}KB base64)`,
  );

  try {
    const result = await recognizePayment(body.image, body.mime_type);
    const elapsed = Date.now() - t0;
    console.log(
      `[Recognize] ✓ 识别完成 (${elapsed}ms) → ¥${result.amount} ${result.merchant} [${result.category}] 置信度:${result.confidence}`,
    );
    return c.json({ success: true, data: { result } });
  } catch (err: unknown) {
    const elapsed = Date.now() - t0;
    const message =
      err instanceof Error ? err.message : 'Unknown recognition error';
    console.error(`[Recognize] ✗ 识别失败 (${elapsed}ms) →`, message);
    return c.json({ success: false, error: message }, 500);
  }
});
