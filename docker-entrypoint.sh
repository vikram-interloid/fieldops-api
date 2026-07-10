#!/bin/sh
set -e

# Compose DATABASE_URL from individual parts if it isn't provided directly.
# ECS injects DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME from the RDS-managed
# Secrets Manager secret; assembling the URL here keeps the password out of the
# CloudFormation template and task definition.
if [ -z "$DATABASE_URL" ] && [ -n "$DB_HOST" ]; then
  : "${DB_PORT:=5432}"
  : "${DB_NAME:=fieldops}"
  export DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
fi

# Optionally apply pending migrations before the app boots. Enable by setting
# RUN_MIGRATIONS=true (e.g. on a one-off ECS task, or on the service for a
# single-instance deploy).
if [ "$RUN_MIGRATIONS" = "true" ]; then
  echo "[entrypoint] Running prisma migrate deploy..."
  node_modules/.bin/prisma migrate deploy
fi

exec "$@"
