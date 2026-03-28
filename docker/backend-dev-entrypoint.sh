#!/bin/sh
set -eu

if [ "${GENTRIX_BACKEND_WATCH_POLLING:-false}" = "true" ]; then
  export CHOKIDAR_USEPOLLING=1
  export CHOKIDAR_INTERVAL="${GENTRIX_BACKEND_WATCH_INTERVAL:-300}"
  export TSC_WATCHFILE="${TSC_WATCHFILE:-UsePolling}"
  export TSC_WATCHDIRECTORY="${TSC_WATCHDIRECTORY:-RecursiveDirectoryUsingDynamicPriorityPolling}"
fi

echo "Generating Prisma client..."
./node_modules/.bin/prisma generate --schema apps/backend/prisma/schema.prisma

echo "Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema apps/backend/prisma/schema.prisma

if [ "${AUTO_SEED_DEMO:-true}" = "true" ]; then
  echo "Checking demo seed..."
  node apps/backend/prisma/seed-if-empty.mjs
fi

echo "Starting Gentrix backend in watch mode..."
exec pnpm nx serve backend
