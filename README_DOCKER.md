# 🐳 Phoenix Explorer - Docker Setup

**One-line command to run everything!**

## Quick Start

```bash
make up
```

That's it! 🎉

## What Gets Started

- ✅ **PostgreSQL** - Database (port 6660)
- ✅ **Redis** - Cache (port 6661)
- ✅ **API** - Node.js REST API (port 6662)
- ✅ **Frontend** - Next.js Web App (port 6663)
- ✅ **Indexer** - Go indexer service

## Access Services

- **Frontend**: http://localhost:6663
- **API**: http://localhost:6662
- **API Health**: http://localhost:6662/health
- **PostgreSQL**: localhost:6660
- **Redis**: localhost:6661

## Commands

### Start Everything
```bash
make up
```

### Stop Everything
```bash
make down
```

### View Logs
```bash
make logs              # All services
make logs-api          # API only
make logs-frontend     # Frontend only
make logs-indexer      # Indexer only
```

### Database
```bash
make db-migrate        # Run migrations
make db-shell          # PostgreSQL shell
make redis-cli         # Redis CLI
```

### Build
```bash
make build             # Rebuild all images
```

### Clean Up
```bash
make clean             # Stop and remove everything
```

## Environment Variables

Create a `.env` file (or copy from `.env.example`):

```env
PHOENIX_RPC_URL=http://host.docker.internal:8545
CORS_ORIGIN=http://localhost:6663
NEXT_PUBLIC_API_URL=http://localhost:6662
NEXT_PUBLIC_WS_URL=ws://localhost:6662/ws
INDEXER_BATCH_SIZE=10
INDEXER_WORKERS=5
LOG_LEVEL=info
```

## Manual Docker Compose

If you prefer using `docker-compose` directly:

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# View logs
docker-compose logs -f

# Rebuild
docker-compose build
```

## Troubleshooting

### Port Already in Use
If ports 6660-6663 are already in use, modify `docker-compose.yml` to use different ports.

### Phoenix Node Connection
Make sure your Phoenix Node is running and accessible. Update `PHOENIX_RPC_URL` in `.env` if needed.

### Database Migrations
Migrations run automatically on first start. To run manually:
```bash
make db-migrate
```

### View Service Status
```bash
docker-compose ps
```

### Restart a Service
```bash
docker-compose restart api
docker-compose restart frontend
docker-compose restart indexer
```

## Development Mode

For development with hot-reload, use `docker-compose.dev.yml`:

```bash
docker-compose -f docker-compose.dev.yml up
```

## Production Deployment

For production, ensure:
1. Set proper environment variables
2. Use production database credentials
3. Configure SSL/TLS
4. Set up reverse proxy (nginx)
5. Configure monitoring

---

**Status**: ✅ Ready to use!  
**One Command**: `make up` 🚀

