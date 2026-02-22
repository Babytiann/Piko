/**
 * Homepage 路由 — POST /piko/homepage/summary/v1
 */

import { Hono } from 'hono';
import { getHomePageData } from '@/lib/services/home';

export const homepageRoutes = new Hono();

homepageRoutes.post('/summary/v1', async (c) => {
  try {
    const data = await getHomePageData();
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load homepage';
    console.error('homepage/summary error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
