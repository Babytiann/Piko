/**
 * Profile 路由
 *   POST /piko/profile/detail/v1
 * 首屏单接口：未登录也返回 200，data.appUser 为 null；登录时返回 appUser + copy + telegramSection。
 */

import { Hono } from 'hono';
import { getSessionOrNull } from '@/lib/auth';
import { getProfilePageData } from '@/lib/services/profile';

export const profileRoutes = new Hono();

profileRoutes.post('/detail/v1', async (c) => {
  try {
    const session = await getSessionOrNull(c.req.raw);
    const appUser = session?.user ?? null;

    let bodySession: string | undefined;
    try {
      const body = (await c.req.json()) as { session?: string };
      bodySession = body.session || undefined;
    } catch {
      // body 可能为空
    }

    const data = await getProfilePageData(appUser, bodySession);
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
          error_code: 'AUTH_EXPIRED',
        },
        401,
      );
    }

    return c.json({ success: false, error: message }, 500);
  }
});
