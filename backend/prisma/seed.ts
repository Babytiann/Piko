import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 创建 Mock 用户（与 backend/lib/auth.ts 中的 MOCK_USER_ID 对应）
  const mockUser = await prisma.user.upsert({
    where: { id: 'mock-user-001' },
    update: {},
    create: {
      id: 'mock-user-001',
      name: 'Mock User',
      nickname: 'Piko 测试用户',
    },
  });

  console.log(`✅ Mock user created: ${mockUser.id} (${mockUser.nickname})`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
