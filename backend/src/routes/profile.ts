/**
 * Profile 路由
 *   POST /piko/profile/detail/v1
 */

import { Hono } from 'hono';
import { getUserId } from '@/lib/auth';
import { getProfilePageData } from '@/lib/services/profile';

export const profileRoutes = new Hono();

profileRoutes.post('/detail/v1', async (c) => {
  try {
    const userId = getUserId(c.req.raw);

    let bodySession: string | undefined;
    try {
      const body = (await c.req.json()) as { session?: string };
      bodySession = body.session || undefined;
    } catch {
      // body 可能为空
    }

    const data = await getProfilePageData(userId, bodySession);
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load profile';
    console.error('profile/detail error:', err);

    if (message.includes('AUTH_KEY_UNREGISTERED')) {
      return c.json(
        {
          success: false,
          error: 'Telegram 登录已失效，请重新绑定',
          errorCode: 'AUTH_EXPIRED',
        },
        401,
      );
    }

    return c.json({ success: false, error: message }, 500);
  }
});
