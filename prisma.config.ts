import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl =
  'postgresql://gentrix:gentrix@localhost:55432/gentrix?schema=public';

export default defineConfig({
  schema: 'apps/backend/prisma/schema.prisma',
  migrations: {
    path: 'apps/backend/prisma/migrations',
    seed: 'node apps/backend/prisma/seed.mjs',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  },
});
