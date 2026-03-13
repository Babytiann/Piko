import 'dotenv/config';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from '../lib/auth.js';
import { aiRoutes } from './routes/ai/index.js';
import { budgetRoutes } from './routes/budget.js';
import { expenseRoutes } from './routes/expense.js';
import { recognizeStreamRoutes } from './routes/recognize-stream.js';
import { homepageRoutes } from './routes/homepage.js';
import { profileRoutes } from './routes/profile.js';
import { chatRoutes } from './routes/chat.js';
import { telegramRoutes } from './routes/telegram/index.js';

const app = new Hono();

// 请求入口日志：便于在 Vercel Logs 中按 path 追溯
app.use('*', async (c, next) => {
  const method = c.req.method;
  const path = c.req.path;
  const qs = c.req.url.includes('?') ? '?' + c.req.url.split('?')[1] : '';
  console.log('[piko] IN', method, path + qs);
  await next();
  const status = c.res.status;
  if (status >= 400) {
    console.warn('[piko] OUT', method, path, '->', status);
  } else {
    console.log('[piko] OUT', method, path, '->', status);
  }
});

const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:3000',
  'https://piko.vercel.app',
];

const corsOrigin = (origin: string, _c: unknown): string | null => {
  if (!origin) return origin as string;
  if (allowedOrigins.includes(origin)) return origin;
  if (origin.endsWith('.vercel.app')) return origin;
  if (process.env.CORS_ORIGINS) {
    const extra = process.env.CORS_ORIGINS.split(',').map((s) => s.trim());
    if (extra.includes(origin)) return origin;
  }
  return null;
};

app.use(
  cors({
    origin: corsOrigin,
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Mock-User-Id', 'Authorization', 'Cookie'],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use(logger() as unknown as MiddlewareHandler);

app.get('/', (c) => c.json({ status: 'ok', service: 'piko-backend' }));

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/ai', aiRoutes);
app.route('/budget', budgetRoutes);
app.route('/expense', expenseRoutes);
app.route('/expense', recognizeStreamRoutes);
app.route('/homepage', homepageRoutes);
app.route('/profile', profileRoutes);
app.route('/chat', chatRoutes);
app.route('/telegram', telegramRoutes);

// 未匹配到路由时打日志，便于排查 404
app.notFound((c) => {
  console.warn('[piko] 404 no route', c.req.method, c.req.path);
  return c.json({ success: false, error: 'Not Found' }, 404);
});

// 未捕获异常打日志，便于排查 500
app.onError((err, c) => {
  console.error('[piko] 500', c.req.method, c.req.path, err);
  return c.json({ success: false, error: 'Internal Server Error' }, 500);
});

export default app;
