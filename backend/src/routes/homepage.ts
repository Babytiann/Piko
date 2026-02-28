import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';
import { getHomePageData } from '../../lib/services/home/index.js';

export const homepageRoutes = new Hono();

homepageRoutes.post('/summary/v1', async (c) => {
  console.log('[piko] homepage/summary/v1 request start');
  try {
    const userId = await getUserId(c.req.raw);
    console.log('[piko] homepage/summary/v1 userId ok', userId);
    const body = await c.req.json().catch(() => ({}));
    const selectedDate =
      typeof body.selected_date === 'string' ? body.selected_date : undefined;
    console.log('[piko] homepage/summary/v1 getHomePageData start');
    const data = await getHomePageData(userId, selectedDate);
    console.log('[piko] homepage/summary/v1 getHomePageData done');
    return c.json({ success: true, data });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Failed to load homepage';
    console.error('homepage/summary error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
