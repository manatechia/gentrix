import { pathToFileURL } from 'node:url';

import { createPrismaClient } from './prisma-client.mjs';
import { seedDatabase } from './seed.mjs';

const demoIds = {
  facility: '91000000-0000-4000-8000-000000000002',
  memberships: {
    admin: '91000000-0000-4000-8000-000000000003',
    nurse: '91000000-0000-4000-8000-000000000004',
    healthDirector: '91000000-0000-4000-8000-000000000005',
  },
  users: {
    admin: '8f4e8eb5-f02f-49f3-8c1e-e8fba2264ec6',
    nurse: 'ba9c797a-3129-4d80-a2c6-16d846a84e56',
    healthDirector: '183a5579-7a6f-4cb0-aa59-a1f7b833c424',
  },
};

const demoUsers = [
  {
    id: demoIds.users.admin,
    membershipId: demoIds.memberships.admin,
    fullName: 'Sofia Quiroga',
    email: 'admin@gentrix.local',
    password: 'gentrix123',
    role: 'admin',
  },
  {
    id: demoIds.users.nurse,
    membershipId: demoIds.memberships.nurse,
    fullName: 'Ana Gomez',
    email: 'ana.gomez@gentrix.local',
    password: 'gentrix123',
    role: 'nurse',
  },
  {
    id: demoIds.users.healthDirector,
    membershipId: demoIds.memberships.healthDirector,
    fullName: 'Maria Lopez',
    email: 'maria.lopez@gentrix.local',
    password: 'gentrix123',
    role: 'health-director',
  },
];

async function ensureDemoUsers(prisma) {
  const organization =
    (await prisma.organization.findUnique({
      where: {
        slug: 'gentrix-demo',
      },
    })) ??
    (await prisma.organization.findFirst({
      where: {
        deletedAt: null,
        status: 'active',
      },
      orderBy: {
        createdAt: 'asc',
      },
    }));

  if (!organization) {
    console.log(
      'Skipping demo user sync: no hay una organizacion activa disponible.',
    );
    return;
  }

  const facility =
    (await prisma.facility.findFirst({
      where: {
        organizationId: organization.id,
        code: 'central',
        deletedAt: null,
        status: 'active',
      },
    })) ??
    (await prisma.facility.findFirst({
      where: {
        organizationId: organization.id,
        deletedAt: null,
        status: 'active',
      },
      orderBy: {
        createdAt: 'asc',
      },
    }));

  for (const demoUser of demoUsers) {
    const now = new Date();
    const user = await prisma.userAccount.upsert({
      where: {
        email: demoUser.email,
      },
      update: {
        fullName: demoUser.fullName,
        password: demoUser.password,
        role: demoUser.role,
        status: 'active',
        deletedAt: null,
        deletedBy: null,
        updatedAt: now,
        updatedBy: 'seed-script',
      },
      create: {
        id: demoUser.id,
        fullName: demoUser.fullName,
        email: demoUser.email,
        password: demoUser.password,
        role: demoUser.role,
        status: 'active',
        createdAt: now,
        createdBy: 'seed-script',
        updatedAt: now,
        updatedBy: 'seed-script',
      },
    });

    const membership = await prisma.organizationMembership.upsert({
      where: {
        organizationId_userId: {
          organizationId: organization.id,
          userId: user.id,
        },
      },
      update: {
        roleCode: demoUser.role,
        status: 'active',
        isDefault: true,
        leftAt: null,
        deletedAt: null,
        deletedBy: null,
        updatedAt: now,
        updatedBy: 'seed-script',
      },
      create: {
        id: demoUser.membershipId,
        organizationId: organization.id,
        userId: user.id,
        roleCode: demoUser.role,
        status: 'active',
        isDefault: true,
        joinedAt: now,
        createdAt: now,
        createdBy: 'seed-script',
        updatedAt: now,
        updatedBy: 'seed-script',
      },
    });

    if (!facility) {
      continue;
    }

    await prisma.membershipFacilityScope.upsert({
      where: {
        membershipId_facilityId: {
          membershipId: membership.id,
          facilityId: facility.id,
        },
      },
      update: {
        scopeType: 'assigned',
        updatedAt: now,
        updatedBy: 'seed-script',
      },
      create: {
        membershipId: membership.id,
        facilityId: facility.id,
        scopeType: 'assigned',
        createdAt: now,
        createdBy: 'seed-script',
        updatedAt: now,
        updatedBy: 'seed-script',
      },
    });
  }
}

export async function seedIfEmpty(prisma) {
  const userCount = await prisma.userAccount.count();

  if (userCount > 0) {
    console.log('Syncing demo access users on existing database...');
    await ensureDemoUsers(prisma);
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
