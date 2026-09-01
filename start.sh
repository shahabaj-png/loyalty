#!/bin/sh

if [ -d "backend" ]; then
  cd backend
fi

echo "=== Generating Prisma Client ==="
npx prisma generate || true

echo "=== Running Database Migrations & Seeding ==="
if [ -n "$DATABASE_URL" ] && ! echo "$DATABASE_URL" | grep -q "localhost:5432"; then
  echo "Running migrations against live database..."
  npx prisma migrate deploy || true
  echo "Seeding initial database..."
  npm run seed || true
else
  echo "⚠️ Skipping prisma migrate deploy for localhost fallback"
fi

echo "=== Starting Application ==="
if [ -f "dist/src/main.js" ]; then
  exec node dist/src/main.js
elif [ -f "dist/main.js" ]; then
  exec node dist/main.js
elif [ -f "backend/dist/src/main.js" ]; then
  exec node backend/dist/src/main.js
elif [ -f "backend/dist/main.js" ]; then
  exec node backend/dist/main.js
else
  echo "❌ Error: main.js not found in dist/"
  exit 1
fi
