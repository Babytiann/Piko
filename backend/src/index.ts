/**
 * Vercel 部署入口 — Hono 官方推荐方式：直接 export default app。
 *
 * Vercel 框架检测会自动找到此文件，无需 api/ 目录或 vercel.json 重写规则。
 * 本地开发使用 `vercel dev`（读取 .env.local，模拟 Vercel 运行时）。
 */

export { default } from './app';

/**
 * 强制使用 Node.js 运行时（telegram / @aws-sdk 等包依赖 Node.js API）。
 */
export const config = {
  runtime: 'nodejs20.x',
};
