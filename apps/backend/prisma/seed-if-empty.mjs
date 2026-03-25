import { pathToFileURL } from 'node:url';

import { createPrismaClient } from './prisma-client.mjs';
import { seedDatabase } from './seed.mjs';

export async function seedIfEmpty(prisma) {
  const userCount = await prisma.userAccount.count();

  if (userCount > 0) {
    console.log('Skipping demo seed: la base ya tiene usuarios.');
    return;
  }

  console.log('Running demo seed on empty database...');
  await seedDatabase(prisma);
}

const isDirectExecution =
  typeof process.argv[1] === 'string' &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectExecution) {
  const prisma = createPrismaClient();

  seedIfEmpty(prisma)
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error(error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
