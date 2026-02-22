import dotenv from 'dotenv';
import path from 'node:path';
import { defineConfig } from 'prisma/config';

// Next.js 用 .env.local，Prisma CLI 需要手动加载
dotenv.config({ path: path.join(__dirname, '.env.local') });

export default defineConfig({
  schema: path.join(__dirname, 'prisma', 'schema.prisma'),

  migrations: {
    path: path.join(__dirname, 'prisma', 'migrations'),
    seed: 'npx tsx prisma/seed.ts',
  },

  datasource: {
    url: process.env.DATABASE_URL ?? '',
  },
});
