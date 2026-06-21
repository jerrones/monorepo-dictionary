#!/bin/sh
set -e

echo "🔄 Running database migrations..."
node dist/database/migrations.js

echo "🌱 Running database seed..."
node dist/database/seed.js || echo "⚠️  Seed skipped (may already be populated)"

echo "🚀 Starting API server..."
exec node dist/index.js
