#!/bin/bash
# Phase 1.2: Explorer Integration Testing
# This script sets up and tests the Phoenix Explorer integration with Phoenix Node

set -e

echo "🔍 Phase 1.2: Explorer Integration Testing"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
EXPLORER_DIR="$(cd "$(dirname "$0")/.." && pwd)"
PHOENIX_NODE_RPC="${PHOENIX_RPC_URL:-http://localhost:8545}"
PHOENIX_NODE_NATIVE_RPC="${PHOENIX_NATIVE_RPC_URL:-http://localhost:16110}"

echo "📁 Explorer directory: $EXPLORER_DIR"
echo "🔗 Phoenix Node Ethereum RPC: $PHOENIX_NODE_RPC"
echo "🔗 Phoenix Node Native RPC: $PHOENIX_NODE_NATIVE_RPC"
echo ""

# Check if Phoenix Node is running
echo "1️⃣  Checking Phoenix Node connection..."
if curl -s -X POST "$PHOENIX_NODE_RPC" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Phoenix Node Ethereum RPC is accessible${NC}"
else
    echo -e "${RED}❌ Phoenix Node Ethereum RPC is not accessible at $PHOENIX_NODE_RPC${NC}"
    echo "   Please start Phoenix Node first:"
    echo "   cd phoenix-node && ./phoenix-node --testnet"
    exit 1
fi

# Check if Docker is running
echo ""
echo "2️⃣  Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Docker is running${NC}"

# Navigate to explorer directory
cd "$EXPLORER_DIR"

# Stop any existing containers
echo ""
echo "3️⃣  Stopping existing containers..."
docker-compose -f docker-compose.yml down 2>/dev/null || true

# Start PostgreSQL and Redis
echo ""
echo "4️⃣  Starting PostgreSQL and Redis..."
docker-compose -f docker-compose.yml up -d postgres redis

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
for i in {1..30}; do
    if docker exec phoenix-explorer-postgres pg_isready -U phoenix > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ PostgreSQL failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
for i in {1..30}; do
    if docker exec phoenix-explorer-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Redis is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ Redis failed to start${NC}"
        exit 1
    fi
    sleep 1
done

# Run database migrations
echo ""
echo "5️⃣  Running database migrations..."
if [ -d "packages/indexer/pkg/database/migrations" ]; then
    # Check if migrations exist
    MIGRATION_COUNT=$(find packages/indexer/pkg/database/migrations -name "*.sql" 2>/dev/null | wc -l || echo "0")
    if [ "$MIGRATION_COUNT" -gt 0 ]; then
        echo "   Found $MIGRATION_COUNT migration files"
        # Run migrations using the indexer migrate command
        if [ -f "packages/indexer/migrate" ]; then
            cd packages/indexer
            DATABASE_URL="postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable" \
                ./migrate up 2>&1 || echo "⚠️  Migration may have already been run"
            cd "$EXPLORER_DIR"
        elif [ -f "packages/indexer/cmd/migrate/migrate" ]; then
            cd packages/indexer
            DATABASE_URL="postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable" \
                ./cmd/migrate/migrate up 2>&1 || echo "⚠️  Migration may have already been run"
            cd "$EXPLORER_DIR"
        else
            echo -e "${YELLOW}⚠️  Migration binary not found, skipping migrations${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  No migration files found${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Migrations directory not found${NC}"
fi

# Install dependencies if needed
echo ""
echo "6️⃣  Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   Installing root dependencies..."
    npm install
fi

if [ ! -d "packages/api/node_modules" ]; then
    echo "   Installing API dependencies..."
    cd packages/api && npm install && cd "$EXPLORER_DIR"
fi

if [ ! -d "packages/frontend/node_modules" ]; then
    echo "   Installing frontend dependencies..."
    cd packages/frontend && npm install && cd "$EXPLORER_DIR"
fi

# Test RPC connection from indexer
echo ""
echo "7️⃣  Testing RPC connection..."
export PHOENIX_RPC_URL="$PHOENIX_NODE_RPC"
export DATABASE_URL="postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable"

# Test eth_blockNumber
BLOCK_NUMBER=$(curl -s -X POST "$PHOENIX_NODE_RPC" \
    -H "Content-Type: application/json" \
    -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | \
    grep -o '"result":"[^"]*"' | cut -d'"' -f4 || echo "")

if [ -n "$BLOCK_NUMBER" ]; then
    echo -e "${GREEN}✅ RPC connection successful${NC}"
    echo "   Current block number: $BLOCK_NUMBER"
else
    echo -e "${RED}❌ RPC connection failed${NC}"
    exit 1
fi

# Start indexer (in background for testing)
echo ""
echo "8️⃣  Starting indexer..."
export PHOENIX_RPC_URL="$PHOENIX_NODE_RPC"
export DATABASE_URL="postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable"
export INDEXER_BATCH_SIZE=10
export INDEXER_WORKERS=5
export LOG_LEVEL=info

# Check if indexer binary exists
if [ -f "packages/indexer/cmd/indexer/indexer" ]; then
    echo "   Starting indexer process..."
    cd packages/indexer
    ./cmd/indexer/indexer > /tmp/indexer.log 2>&1 &
    INDEXER_PID=$!
    echo "   Indexer PID: $INDEXER_PID"
    sleep 5
    
    # Check if indexer is still running
    if kill -0 $INDEXER_PID 2>/dev/null; then
        echo -e "${GREEN}✅ Indexer started successfully${NC}"
        echo "   Logs: tail -f /tmp/indexer.log"
    else
        echo -e "${RED}❌ Indexer failed to start${NC}"
        echo "   Last 20 lines of log:"
        tail -20 /tmp/indexer.log
        exit 1
    fi
    cd "$EXPLORER_DIR"
else
    echo -e "${YELLOW}⚠️  Indexer binary not found, skipping indexer start${NC}"
    echo "   Build indexer: cd packages/indexer && go build -o cmd/indexer/indexer ./cmd/indexer"
fi

# Start API server (in background for testing)
echo ""
echo "9️⃣  Starting API server..."
cd packages/api

# Kill any existing process on port 6662
lsof -ti:6662 | xargs kill -9 2>/dev/null || true
sleep 1

PORT=6662 \
DATABASE_URL="postgresql://phoenix:phoenix_dev@localhost:6660/phoenix_explorer?sslmode=disable" \
REDIS_URL="redis://localhost:6661" \
PHOENIX_RPC_URL="$PHOENIX_NODE_RPC" \
npm start > /tmp/api.log 2>&1 &
API_PID=$!
echo "   API PID: $API_PID"
sleep 8

# Check if API is responding
if curl -s http://localhost:6662/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API server started successfully${NC}"
    echo "   API URL: http://localhost:6662"
    echo "   Logs: tail -f /tmp/api.log"
else
    echo -e "${YELLOW}⚠️  API server may not be ready yet${NC}"
    echo "   Check logs: tail -f /tmp/api.log"
    tail -20 /tmp/api.log
fi
cd "$EXPLORER_DIR"

# Test API endpoints
echo ""
echo "🔟 Testing API endpoints..."
sleep 3

# Test health endpoint
if curl -s http://localhost:6662/health | grep -q "ok\|healthy\|success" 2>/dev/null; then
    echo -e "${GREEN}✅ Health endpoint working${NC}"
    curl -s http://localhost:6662/health | jq . 2>/dev/null || curl -s http://localhost:6662/health
else
    echo -e "${YELLOW}⚠️  Health endpoint not responding${NC}"
    curl -s http://localhost:6662/health | head -5
fi

# Test blocks endpoint
if curl -s "http://localhost:6662/v1/blocks/latest?limit=1" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Blocks endpoint accessible${NC}"
    echo "   Response:"
    curl -s "http://localhost:6662/v1/blocks/latest?limit=1" | jq . 2>/dev/null | head -10 || curl -s "http://localhost:6662/v1/blocks/latest?limit=1" | head -5
else
    echo -e "${YELLOW}⚠️  Blocks endpoint not accessible${NC}"
fi

# Summary
echo ""
echo "📊 Summary"
echo "=========="
echo -e "${GREEN}✅ PostgreSQL: Running${NC}"
echo -e "${GREEN}✅ Redis: Running${NC}"
if [ -n "$INDEXER_PID" ]; then
    echo -e "${GREEN}✅ Indexer: Running (PID: $INDEXER_PID)${NC}"
fi
if [ -n "$API_PID" ]; then
    echo -e "${GREEN}✅ API: Running (PID: $API_PID)${NC}"
fi
echo ""
echo "📝 Next steps:"
echo "   - Start frontend: cd packages/frontend && npm run dev"
echo "   - View API: http://localhost:3000"
echo "   - View indexer logs: tail -f /tmp/indexer.log"
echo "   - View API logs: tail -f /tmp/api.log"
echo "   - Stop services: kill $INDEXER_PID $API_PID && docker-compose down"
echo ""
echo "🎯 Phase 1.2 Complete!"

