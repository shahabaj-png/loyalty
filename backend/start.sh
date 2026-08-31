#!/bin/sh

echo "=== Generating Prisma Client ==="
npx prisma generate || true

echo "=== Running Database Migrations ==="
npx prisma migrate deploy || echo "⚠️ Database migration notice: Skipped or finished with warning"

echo "=== Starting Application ==="
exec node dist/main
