#!/bin/sh

if [ ! -f ".env" ]; then
  echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/loyalty"' > .env
fi

export DATABASE_URL="${DATABASE_URL:-postgresql://postgres:postgres@localhost:5432/loyalty}"

if [ -d "backend" ]; then
  cd backend
  if [ ! -f ".env" ]; then
    echo 'DATABASE_URL="postgresql://postgres:postgres@localhost:5432/loyalty"' > .env
  fi
fi

echo "=== Generating Prisma Client ==="
npx prisma generate || true

echo "=== Running Database Migrations ==="
npx prisma migrate deploy || echo "⚠️ Migration notice: Skipped or finished with warning"

echo "=== Starting Application ==="
exec node dist/main
