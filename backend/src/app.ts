/**
 * Hono 主应用 — 挂载所有路由模块。
 *
 * 路由前缀规则（与原 Next.js app/piko/... 保持一致）:
 *   /piko/ai/**
 *   /piko/expense/**
 *   /piko/homepage/**
 *   /piko/profile/**
 *   /piko/chat/**
 *   /piko/telegram/**
 */

import 'dotenv/config';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import { aiRoutes } from './routes/ai';
import { expenseRoutes } from './routes/expense';
import { homepageRoutes } from './routes/homepage';
import { profileRoutes } from './routes/profile';
import { chatRoutes } from './routes/chat';
import { telegramRoutes } from './routes/telegram';

const app = new Hono();

// ── 全局中间件 ────────────────────────────────────────────────────────────────

app.use(
  '*',
  cors({
    origin: [
      'http://localhost:8081', // Expo Metro dev
      'http://localhost:3000', // Web preview
      'https://piko.vercel.app', // Production（按实际调整）
    ],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Mock-User-Id', 'Authorization'],
    credentials: true,
    maxAge: 86400,
  }),
);

app.use('*', logger());

// ── 健康检查 ─────────────────────────────────────────────────────────────────

app.get('/', (c) => c.json({ status: 'ok', service: 'piko-backend' }));

// ── 路由模块 ─────────────────────────────────────────────────────────────────

app.route('/piko/ai', aiRoutes);
app.route('/piko/expense', expenseRoutes);
app.route('/piko/homepage', homepageRoutes);
app.route('/piko/profile', profileRoutes);
app.route('/piko/chat', chatRoutes);
app.route('/piko/telegram', telegramRoutes);

export default app;
