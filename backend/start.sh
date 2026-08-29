#!/bin/sh
set -e

echo "=== Generating Prisma Client ==="
npx prisma generate

echo "=== Running Database Migrations ==="
npx prisma migrate deploy

echo "=== Starting Application ==="
node dist/main
