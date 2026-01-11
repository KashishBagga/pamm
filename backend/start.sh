#!/bin/sh

# Wait for database to be ready
echo "Waiting for database..."
while ! pg_isready -h db -U ${DB_USER:-admin} -d ${DB_NAME:-rbac_system}; do
  sleep 1
done

echo "Database is ready!"

# Run migrations
echo "Running database migrations..."
alembic upgrade head

# Seed data
echo "Seeding database..."
python -m app.seed_data

# Start server
echo "Starting server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000
