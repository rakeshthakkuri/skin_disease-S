#!/bin/bash
# Production startup script for AcneAI Backend

set -e

echo "🚀 Starting AcneAI Backend in Production Mode..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  Warning: .env file not found. Using default configuration."
fi

# Run database migrations
echo "📦 Running database migrations..."
alembic upgrade head

# Start the application with Gunicorn
echo "✅ Starting Gunicorn server..."
exec gunicorn app.main:app -c gunicorn_config.py

