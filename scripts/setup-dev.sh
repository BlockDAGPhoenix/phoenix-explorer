#!/bin/bash
# Setup script for Phoenix Explorer development environment

set -e

echo "🚀 Setting up Phoenix Explorer development environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start development database
echo "📦 Starting PostgreSQL and Redis containers..."
docker-compose -f docker-compose.dev.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
timeout=30
counter=0
until docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U phoenix > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ PostgreSQL failed to start within $timeout seconds"
        exit 1
    fi
done

echo "✅ PostgreSQL is ready!"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
counter=0
until docker-compose -f docker-compose.dev.yml exec -T redis redis-cli ping > /dev/null 2>&1; do
    sleep 1
    counter=$((counter + 1))
    if [ $counter -ge $timeout ]; then
        echo "❌ Redis failed to start within $timeout seconds"
        exit 1
    fi
done

echo "✅ Redis is ready!"

# Run database migrations
echo "🗄️  Running database migrations..."
cd packages/indexer
go run cmd/migrate/main.go

echo "✅ Development environment setup complete!"
echo ""
echo "📝 Next steps:"
echo "  1. Start the indexer: cd packages/indexer && go run cmd/indexer/main.go"
echo "  2. Start the API: cd packages/api && npm run dev"
echo "  3. Start the frontend: cd packages/frontend && npm run dev"

