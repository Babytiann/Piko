import { Hono } from 'hono';
import { getSessionOrNull } from '../../lib/auth.js';
import { getHomePageData } from '../../lib/services/home/index.js';
import { reverseGeocode } from '../../lib/services/weather/geocoding.js';

export const homepageRoutes = new Hono();

homepageRoutes.post('/summary/v1', async (c) => {
  console.log('[piko] homepage/summary/v1 request start');
  try {
    const session = await getSessionOrNull(c.req.raw);
    const userId = session?.user?.id ?? null;
    const body = (await c.req.json().catch(() => ({}))) as {
      selected_date?: string;
      weather_city?: string;
    };
    const selectedDate =
      typeof body.selected_date === 'string' ? body.selected_date : undefined;
    const weatherCity =
      typeof body.weather_city === 'string' ? body.weather_city : undefined;
    console.log('[piko] homepage/summary/v1 getHomePageData start');
    const data = await getHomePageData(
      userId ?? undefined,
      selectedDate,
      weatherCity,
    );
    console.log('[piko] homepage/summary/v1 getHomePageData done');
    return c.json({ success: true, data });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : 'Failed to load homepage';
    console.error('homepage/summary error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});

homepageRoutes.get('/weather/reverse-geocode', async (c) => {
  try {
    // 未登录也可访问，用于首页自动定位城市
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
    const message =
      err instanceof Error ? err.message : 'Reverse geocode failed';
    console.error('homepage/weather/reverse-geocode error:', err);
    return c.json({ success: false, error: message }, 500);
  }
});
