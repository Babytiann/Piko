import { Hono } from 'hono';

import {
  getSessionOrNull,
  getUserId,
  UnauthorizedError,
} from '../../lib/auth.js';
import { getProfilePageData } from '../../lib/services/profile/index.js';
import {
  updateUserProfile,
  deleteUserAccount,
  clearUserData,
} from '../../lib/services/user/index.js';

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

profileRoutes.patch('/update', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const body = (await c.req.json()) as {
      nickname?: string;
      weather_city?: string | null;
    };
    const nickname =
      typeof body.nickname === 'string' ? body.nickname.trim() : undefined;
    const weatherCity =
      body.weather_city === null || body.weather_city === ''
        ? null
        : typeof body.weather_city === 'string'
          ? body.weather_city.trim() || null
          : undefined;
    const updates: Parameters<typeof updateUserProfile>[1] = {};
    if (nickname !== undefined) updates.nickname = nickname;
    if (weatherCity !== undefined) updates.weatherCity = weatherCity;
    if (Object.keys(updates).length > 0) {
      await updateUserProfile(userId, updates);
    }
    return c.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('profile/update error:', err);
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update profile',
      },
      500,
    );
  }
});

profileRoutes.delete('/account', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    await deleteUserAccount(userId);
    return c.json({ success: true });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('profile/account delete error:', err);
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete account',
      },
      500,
    );
  }
});

profileRoutes.post('/clear-data', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const cleared = await clearUserData(userId);
    return c.json({ success: true, cleared });
  } catch (err) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    console.error('profile/clear-data error:', err);
    return c.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to clear data',
      },
      500,
    );
  }
});
