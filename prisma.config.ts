import 'dotenv/config';

import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'apps/backend/prisma/schema.prisma',
  migrations: {
    path: 'apps/backend/prisma/migrations',
    seed: 'node apps/backend/prisma/seed.mjs',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
