import { Hono } from 'hono';
import { resolveLocationRequest } from '../../../lib/services/location-bridge/index.js';

export const locationRoutes = new Hono();

locationRoutes.post('/location/v1', async (c) => {
  interface LocationResponseBody {
    request_id: string;
    location: { latitude: number; longitude: number } | null;
  }

  let body: LocationResponseBody;
  try {
    body = (await c.req.json()) as LocationResponseBody;
  } catch {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  if (!body.request_id) {
    return c.json({ success: false, error: 'request_id is required' }, 400);
  }

  const resolved = resolveLocationRequest(body.request_id, body.location);

  if (!resolved) {
    return c.json(
      { success: false, error: 'Request not found or timed out' },
      404,
    );
  }

  return c.json({ success: true });
});
