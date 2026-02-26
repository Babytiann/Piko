/**
 * Drizzle ORM 客户端单例 — 使用 @neondatabase/serverless HTTP driver。
 *
 * 通过 globalThis.__db 防止开发模式热重载时重复创建连接。
 * 生产环境 Vercel serverless 函数每次调用复用同一连接。
 */

import { neon } from '@neondatabase/serverless';
import { drizzle, type NeonHttpDatabase } from 'drizzle-orm/neon-http';

import * as schema from './schema.js';

type DB = NeonHttpDatabase<typeof schema>;

declare global {
  // eslint-disable-next-line no-var
  var __db: DB | undefined;
}

function createDbClient(): DB {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('[DB] DATABASE_URL 环境变量未配置');
  }

  const sql = neon(databaseUrl);
  return drizzle(sql, { schema });
}

/**
 * 懒加载单例：首次访问 db.xxx 时才调用 createDbClient()。
 * 避免模块 import 阶段（env 尚未注入）就抛出 DATABASE_URL 错误。
 */
function getDb(): DB {
  if (!globalThis.__db) {
    globalThis.__db = createDbClient();
  }
  return globalThis.__db;
}

export const db = new Proxy({} as DB, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

// 导出 schema 方便各 service 文件直接引用
export * from './schema.js';
