import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import { users } from './schema.js';

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL 环境变量未配置');
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  console.log('🌱 Seeding database...');

  // 创建 Mock 用户（upsert：已存在则跳过，不覆盖）
  await db
    .insert(users)
    .values({
      id: 'mock-user-001',
      name: 'Mock User',
      nickname: 'Piko 测试用户',
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .onConflictDoNothing({ target: users.id });

  console.log('✅ Mock user ensured: mock-user-001 (Piko 测试用户)');
}

main()
  .then(() => {
    console.log('🎉 Seed completed!');
    process.exit(0);
  })
  .catch((err: unknown) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  });
