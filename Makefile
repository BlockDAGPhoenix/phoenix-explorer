.PHONY: up down restart logs clean build test help

# Default target
help:
	@echo "Phoenix Explorer - Docker Commands"
	@echo ""
	@echo "Usage: make [target]"
	@echo ""
	@echo "Targets:"
	@echo "  up          - Start all services (one-line command)"
	@echo "  down        - Stop all services"
	@echo "  restart     - Restart all services"
	@echo "  logs        - View logs from all services"
	@echo "  logs-api    - View API logs"
	@echo "  logs-frontend - View Frontend logs"
	@echo "  logs-indexer - View Indexer logs"
	@echo "  build       - Build all Docker images"
	@echo "  clean       - Stop and remove all containers, volumes"
	@echo "  test        - Run tests"
	@echo "  db-migrate  - Run database migrations"
	@echo "  db-shell    - Open PostgreSQL shell"
	@echo "  redis-cli   - Open Redis CLI"

# One-line command to start everything
up:
	@echo "🚀 Starting Phoenix Explorer..."
	@docker-compose up -d
	@echo "✅ Services started!"
	@echo ""
	@echo "📊 Services:"
	@echo "  - API:        http://localhost:6662"
	@echo "  - Frontend:   http://localhost:6663"
	@echo "  - PostgreSQL: localhost:6660"
	@echo "  - Redis:      localhost:6661"
	@echo ""
	@echo "📝 View logs: make logs"
	@echo "🛑 Stop:      make down"

down:
	@echo "🛑 Stopping Phoenix Explorer..."
	@docker-compose down

restart:
	@echo "🔄 Restarting Phoenix Explorer..."
	@docker-compose restart

logs:
	@docker-compose logs -f

logs-api:
	@docker-compose logs -f api

logs-frontend:
	@docker-compose logs -f frontend

logs-indexer:
	@docker-compose logs -f indexer

build:
	@echo "🔨 Building Docker images..."
	@docker-compose build

clean:
	@echo "🧹 Cleaning up..."
	@docker-compose down -v
	@docker system prune -f

test:
	@echo "🧪 Running tests..."
	@cd packages/api && npm test
	@cd packages/indexer && go test ./...

db-migrate:
	@echo "📊 Running database migrations..."
	@docker-compose exec indexer ./indexer migrate

db-shell:
	@docker-compose exec postgres psql -U phoenix -d phoenix_explorer

redis-cli:
	@docker-compose exec redis redis-cli

