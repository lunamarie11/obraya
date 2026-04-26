#!/bin/sh
set -e

echo "Running Prisma migrations..."
npx prisma migrate deploy

echo "Starting ObraYa API..."
exec node dist/src/main.js
