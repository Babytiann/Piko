import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Prisma Client 单例。
 *
 * Prisma 7 移除了 datasourceUrl，必须通过 Driver Adapter 连接数据库。
 * 这里使用 @prisma/adapter-pg（基于 node-postgres）。
 *
 * 在 Next.js 开发模式下，热重载会导致模块被多次执行。
 * 使用 globalThis 缓存确保全局只有一个 PrismaClient 实例，
 * 避免超出数据库连接数上限。
 */

const globalForPrisma = globalThis as unknown as {
  __prismaClient?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

export const prisma: PrismaClient =
  globalForPrisma.__prismaClient ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.__prismaClient = prisma;
}
