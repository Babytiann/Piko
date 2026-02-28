/**
 * Auth 层 — 基于 better-auth + Drizzle adapter。
 *
 * 架构说明：
 *   - `auth` 实例：better-auth 主入口，处理 /api/auth/* 路由
 *   - `getUserId(request)`：所有业务路由的鉴权入口，从 session 解析，无 session 抛错
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { expo } from '@better-auth/expo';

import { db, users, accounts, sessions, verifications } from '../db/index.js';

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

  plugins: [expo()],

  socialProviders: {
    apple: {
      clientId: process.env.APPLE_CLIENT_ID ?? '',
      clientSecret: process.env.APPLE_CLIENT_SECRET ?? '',
      appBundleIdentifier: process.env.APPLE_APP_BUNDLE_IDENTIFIER ?? undefined,
    },
  },

  trustedOrigins: [
    'https://appleid.apple.com',
    'piko://',
    'exp://localhost:8081',
    'exp://',
    'http://localhost:3000',
    'http://localhost:8081',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
});

// ---------------------------------------------------------------------------
// 鉴权：从 session 解析 userId，无 session 抛错
// ---------------------------------------------------------------------------

export class UnauthorizedError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedError';
  }
}

/**
 * 从请求中提取当前用户的 ID。依赖 better-auth 的 Cookie session。
 * 无 session 时抛出 UnauthorizedError，调用方应返回 401。
 */
export async function getUserId(request: Request): Promise<string> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }
  return session.user.id;
}

/**
 * 从请求中获取 session（含 user），无登录时返回 null。用于 profile 等需「未登录也返回 200」的接口。
 */
export async function getSessionOrNull(request: Request): Promise<{
  user: { id: string; name: string | null; email: string | null };
} | null> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return null;
  return {
    user: {
      id: session.user.id,
      name: session.user.name ?? null,
      email: session.user.email ?? null,
    },
  };
}
