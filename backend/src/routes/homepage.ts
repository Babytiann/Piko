import { Hono } from 'hono';
import { getUserId, UnauthorizedError } from '../../lib/auth.js';
import { getHomePageData } from '../../lib/services/home/index.js';
import { reverseGeocode } from '../../lib/services/weather/geocoding.js';

export const homepageRoutes = new Hono();

homepageRoutes.post('/summary/v1', async (c) => {
  console.log('[piko] homepage/summary/v1 request start');
  try {
    const userId = await getUserId(c.req.raw);
    console.log('[piko] homepage/summary/v1 userId ok', userId);
    const body = (await c.req.json().catch(() => ({}))) as {
      selected_date?: string;
      weather_city?: string;
    };
    const selectedDate =
      typeof body.selected_date === 'string' ? body.selected_date : undefined;
    const weatherCity =
      typeof body.weather_city === 'string' ? body.weather_city : undefined;
    console.log('[piko] homepage/summary/v1 getHomePageData start');
    const data = await getHomePageData(userId, selectedDate, weatherCity);
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

homepageRoutes.get('/weather/reverse-geocode', async (c) => {
  try {
    await getUserId(c.req.raw);
    const lat = Number(c.req.query('lat'));
    const lon = Number(c.req.query('lon'));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return c.json(
        { success: false, error: '缺少或无效的 lat / lon 参数' },
        400,
      );
    }
    const { city } = await reverseGeocode(lat, lon);
    return c.json({ success: true, data: { city } });
  } catch (err: unknown) {
    if (err instanceof UnauthorizedError) {
      return c.json({ success: false, error: 'Unauthorized' }, 401);
    }
    const message =
      err instanceof Error ? err.message : 'Reverse geocode failed';
    console.error('homepage/weather/reverse-geocode error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
