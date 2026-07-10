# syntax=docker/dockerfile:1

###############################################################################
# FieldOps API — production image
#
# Multi-stage build:
#   1. builder — install all deps, generate the Prisma client, compile Nest.
#   2. runner  — slim runtime with the compiled app + node_modules.
#
# The compiled entrypoint is dist/src/main.js (nest preserves the src/ tree),
# and the Prisma client is emitted into dist/generated/prisma by the build.
# The app listens on PORT (default 3001).
###############################################################################

# ---- builder ---------------------------------------------------------------
FROM node:24-slim AS builder
WORKDIR /app

# pnpm via corepack (repo uses a pnpm-lock.yaml).
RUN corepack enable

# OpenSSL is required by Prisma's query engine.
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching).
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Copy the source and build.
COPY . .
RUN pnpm exec prisma generate \
    && pnpm run build

# ---- runner ----------------------------------------------------------------
FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3001

RUN corepack enable \
    && apt-get update -y && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

# Bring over the full dependency tree (includes the Prisma CLI, so the same
# image can run `prisma migrate deploy` as a one-off task) plus the build.
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/generated ./generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# Assembles DATABASE_URL from DB_* parts (if not already set) and can run
# migrations when RUN_MIGRATIONS=true, then execs the CMD.
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Run as the built-in non-root node user.
USER node

EXPOSE 3001
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/src/main.js"]
