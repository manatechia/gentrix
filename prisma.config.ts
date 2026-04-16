import 'dotenv/config';

import { defineConfig } from 'prisma/config';

const defaultDatabaseUrl =
  'postgresql://gentrix:gentrix@localhost:55515/gentrix?schema=public';

// Para `prisma migrate` preferimos DIRECT_URL (Supabase exige conexion
// directa al puerto 5432, sin pooler). En dev local DIRECT_URL puede no
// estar definida y usamos DATABASE_URL.
const migrationsDatabaseUrl =
  process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? defaultDatabaseUrl;

export default defineConfig({
  schema: 'apps/backend/prisma/schema.prisma',
  migrations: {
    path: 'apps/backend/prisma/migrations',
    seed: 'node apps/backend/prisma/seed.mjs',
  },
  datasource: {
    url: migrationsDatabaseUrl,
  },
});
