import 'dotenv/config';
import type { MiddlewareHandler } from 'hono';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { auth } from '../lib/auth.js';
import { aiRoutes } from './routes/ai/index.js';
import { budgetRoutes } from './routes/budget.js';
import { expenseRoutes } from './routes/expense.js';
import { homepageRoutes } from './routes/homepage.js';
import { profileRoutes } from './routes/profile.js';
import { chatRoutes } from './routes/chat.js';
import { telegramRoutes } from './routes/telegram/index.js';

const app = new Hono();

app.use(
  cors({
    origin: [
      'http://localhost:8081', // Expo Metro dev
      'http://localhost:3000', // Web preview
      'https://piko.vercel.app', // Production（按实际调整）
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Mock-User-Id', 'Authorization', 'Cookie'],
    credentials: true,
    maxAge: 86400,
  }) as unknown as MiddlewareHandler,
);

app.use(logger() as unknown as MiddlewareHandler);

app.get('/', (c) => c.json({ status: 'ok', service: 'piko-backend' }));

app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

app.route('/piko/ai', aiRoutes);
app.route('/piko/budget', budgetRoutes);
app.route('/piko/expense', expenseRoutes);
app.route('/piko/homepage', homepageRoutes);
app.route('/piko/profile', profileRoutes);
app.route('/piko/chat', chatRoutes);
app.route('/piko/telegram', telegramRoutes);

export default app;
