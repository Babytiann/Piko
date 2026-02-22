/**
 * 本地备用开发服务器 — 使用 @hono/node-server 直接运行。
 *
 * 推荐使用 `pnpm dev`（vercel dev）以更好地模拟 Vercel 运行时；
 * 此文件作为不依赖 Vercel CLI 时的备用方案（`pnpm dev:node`）。
 * 环境变量通过 --env-file .env.local 在模块加载前注入。
 */

import { serve } from '@hono/node-server';
import app from './app';

const PORT = Number(process.env.PORT ?? 3001);

serve(
  {
    fetch: app.fetch,
    port: PORT,
  },
  () => {
    console.log(`[Piko Backend] 本地开发服务器运行在 http://localhost:${PORT}`);
  },
);
