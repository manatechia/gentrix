const { spawnSync } = require('node:child_process');

const isRender = process.env.RENDER === 'true';

function runStep(args, description) {
  console.log(description);
  const result =
    process.platform === 'win32'
      ? spawnSync('cmd.exe', ['/d', '/s', '/c', `pnpm ${args.join(' ')}`], {
          stdio: 'inherit',
          shell: false,
        })
      : spawnSync('pnpm', args, {
          stdio: 'inherit',
          shell: false,
        });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

if (isRender) {
  runStep(
    ['exec', 'nx', 'run', 'backend:build:production'],
    'Render build detected: building the NestJS backend only.',
  );

  if (process.env.DIRECT_URL || process.env.DATABASE_URL) {
    runStep(
      [
        'exec',
        'prisma',
        'migrate',
        'deploy',
        '--schema=apps/backend/prisma/schema.prisma',
      ],
      'Database credentials detected: applying Prisma migrations.',
    );
  } else {
    console.log(
      'Skipping Prisma migrations because DIRECT_URL and DATABASE_URL are not set during build.',
    );
  }
} else {
  runStep(
    ['exec', 'nx', 'run-many', '-t', 'build'],
    'Local build detected: building all Nx projects.',
  );
}
