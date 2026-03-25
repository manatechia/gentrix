FROM node:22-bookworm-slim AS workspace-deps

WORKDIR /app

ARG DATABASE_URL=postgresql://gentrix:gentrix@postgres:5432/gentrix?schema=public

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
ENV DATABASE_URL=$DATABASE_URL

RUN corepack enable
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml nx.json tsconfig.base.json prisma.config.ts ./

RUN pnpm install --frozen-lockfile

FROM workspace-deps AS workspace

COPY apps ./apps
COPY libs ./libs
RUN pnpm prisma generate

FROM workspace AS backend-build

RUN pnpm nx run backend:build:production

FROM workspace AS frontend-build

RUN pnpm nx run frontend:build

FROM workspace AS frontend-dev

ENV NODE_ENV=development
EXPOSE 4200

CMD ["pnpm", "nx", "serve", "frontend", "--host", "0.0.0.0"]

FROM node:22-bookworm-slim AS backend-runtime

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3333

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=backend-build /app/node_modules ./node_modules
COPY --from=backend-build /app/dist ./dist
COPY --from=backend-build /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=backend-build /app/prisma.config.ts ./prisma.config.ts
COPY docker/backend-entrypoint.sh ./docker/backend-entrypoint.sh

RUN chmod +x ./docker/backend-entrypoint.sh

EXPOSE 3333

CMD ["./docker/backend-entrypoint.sh"]

FROM nginx:1.27-alpine AS frontend-runtime

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=frontend-build /app/dist/apps/frontend /usr/share/nginx/html

EXPOSE 80
