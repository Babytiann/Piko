/**
 * Vercel Serverless 入口 — Hono 应用部署到 Vercel Edge/Node Runtime。
 *
 * 文件路径 api/[[...route]].ts 让所有 /api/** 请求都转发给 Hono。
 * Vercel 配置（vercel.json）需把 /* 重写到 /api/[[...route]]，
 * 这样 /piko/** 请求也能到达此处理器。
 */

import app from '../src/app';

export const config = {
  runtime: 'nodejs20.x',
};

export default app;
