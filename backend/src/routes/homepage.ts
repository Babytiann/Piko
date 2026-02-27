import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';
import { getHomePageData } from '../../lib/services/home/index.js';

export const homepageRoutes = new Hono();

homepageRoutes.post('/summary/v1', async (c) => {
  try {
    const userId = await getUserId(c.req.raw);
    const data = await getHomePageData(userId);
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
