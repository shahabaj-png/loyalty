#!/bin/sh

if [ -d "backend" ]; then
  cd backend
fi

echo "=== Generating Prisma Client ==="
npx prisma generate || true

echo "=== Running Database Migrations ==="
npx prisma migrate deploy || echo "⚠️ Migration notice: Skipped or finished with warning"

echo "=== Starting Application ==="
exec node dist/main
