#!/bin/sh
set -eu

echo "Applying Prisma migrations..."
./node_modules/.bin/prisma migrate deploy --schema apps/backend/prisma/schema.prisma

if [ "${AUTO_SEED_DEMO:-true}" = "true" ]; then
  echo "Checking demo seed..."
  node apps/backend/prisma/seed-if-empty.mjs
fi

echo "Starting Gentrix backend..."
exec node dist/apps/backend/main.js
