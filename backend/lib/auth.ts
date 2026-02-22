/**
 * Auth 层 — 基于 better-auth + Drizzle adapter。
 *
 * 架构说明：
 *   - `auth` 实例：better-auth 主入口，处理 /api/auth/* 路由
 *   - `getUserId(request)`：所有业务路由的鉴权入口，接口签名稳定
 *
 * 当前状态（Mock 阶段）：
 *   持续读取 `X-Mock-User-Id` header，确保开发期间无需真实 Apple 凭据。
 *   Apple Sign In 接入后只需在此文件启用 apple provider 并更新 getUserId。
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db, users, accounts, sessions, verifications } from '@/db';

// ---------------------------------------------------------------------------
// better-auth 实例
// ---------------------------------------------------------------------------

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: users,
      account: accounts,
      session: sessions,
      verification: verifications,
    },
  }),

  // ── Apple Sign In（凭据待填充，结构已预置） ──────────────────────────────
  // 接入步骤:
  //   1. 在 App Store Connect 生成 Service ID 和 Key
  //   2. 填充以下环境变量: APPLE_CLIENT_ID / APPLE_CLIENT_SECRET
  //   3. 取消下面的注释块
  //
  // socialProviders: {
  //   apple: {
  //     clientId: process.env.APPLE_CLIENT_ID!,
  //     clientSecret: process.env.APPLE_CLIENT_SECRET!,
  //   },
  // },

  trustedOrigins: [
    process.env.FRONTEND_URL ?? 'exp://localhost:8081',
    'http://localhost:3000',
  ],
});

// ---------------------------------------------------------------------------
// 默认 Mock 用户 ID（seed.ts 已预创建此记录）
// ---------------------------------------------------------------------------

const MOCK_USER_ID = 'mock-user-001';

/**
 * 从请求中提取当前用户的 ID。
 *
 * **Mock 阶段**（当前）：
 *   从 `X-Mock-User-Id` header 读取，无则返回 `mock-user-001`。
 *
 * **Apple Sign In 接入后**（TODO）：
 *   调用 better-auth session API 验证 Bearer token：
 *   ```ts
 *   const session = await auth.api.getSession({ headers: request.headers });
 *   if (!session?.user?.id) throw new Error('Unauthorized');
 *   return session.user.id;
 *   ```
 *   切换时只需修改此函数，所有路由自动生效。
 */
export function getUserId(request: Request): string {
  // TODO: Apple Sign In 接入后替换为:
  // const session = await auth.api.getSession({ headers: request.headers });
  // if (!session?.user?.id) throw new Error('Unauthorized');
  // return session.user.id;

  return request.headers.get('X-Mock-User-Id') ?? MOCK_USER_ID;
}
