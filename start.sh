#!/bin/sh

if [ -d "backend" ]; then
  cd backend
fi

echo "=== Generating Prisma Client ==="
npx prisma generate || true

echo "=== Running Database Migrations ==="
if [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -q "localhost:5432"; then
  echo "Running migrations against live database..."
  npx prisma migrate deploy || echo "⚠️ Database migration notice: Skipped or finished with warning"
else
  echo "⚠️ Skipping prisma migrate deploy for localhost fallback"
fi

echo "=== Starting Application ==="
exec node dist/main
