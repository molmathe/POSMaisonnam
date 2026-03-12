#!/bin/sh
set -e

# Wait for Postgres: retry migrate until it succeeds (max 30s)
echo "Waiting for database and running migrations..."
for i in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30; do
  if npx prisma migrate deploy 2>/dev/null; then
    echo "Migrations applied."
    break
  fi
  if [ "$i" = "30" ]; then
    echo "Migration failed after 30 attempts."
    exit 1
  fi
  sleep 1
done

echo "Starting application..."
exec "$@"
