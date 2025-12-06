# 🚀 Phoenix Explorer - Quick Start

## One-Line Command

```bash
make up
```

That's it! The entire Phoenix Explorer stack will start.

---

## What You Get

After running `make up`, you'll have:

- ✅ **Frontend**: http://localhost:6663
- ✅ **API**: http://localhost:6662
- ✅ **PostgreSQL**: localhost:6660
- ✅ **Redis**: localhost:6661
- ✅ **Indexer**: Running in background

---

## Prerequisites

1. **Docker** and **Docker Compose** installed
2. **Phoenix Node** running (or update `PHOENIX_RPC_URL` in `.env`)

---

## First Time Setup

1. **Clone/Navigate to project**:
   ```bash
   cd phoenix-explorer
   ```

2. **Create environment file** (optional):
   ```bash
   cp .env.example .env
   # Edit .env if needed
   ```

3. **Start everything**:
   ```bash
   make up
   ```

4. **Wait for services** (30-60 seconds):
   ```bash
   make logs
   ```

5. **Access the explorer**:
   - Open http://localhost:6663 in your browser

---

## Common Commands

```bash
make up              # Start everything
make down            # Stop everything
make logs            # View all logs
make logs-api        # View API logs
make logs-frontend   # View frontend logs
make logs-indexer    # View indexer logs
make restart         # Restart all services
make clean           # Stop and remove everything
```

---

## Troubleshooting

### Port Already in Use
If ports are in use, modify `docker-compose.yml`:
```yaml
ports:
  - "6664:3000"  # Change frontend port (use 6664-6666)
```

### Phoenix Node Not Found
Update `.env`:
```env
PHOENIX_RPC_URL=http://your-phoenix-node:8545
```

### Database Issues
Reset database:
```bash
make clean
make up
```

### View Service Status
```bash
docker-compose ps
```

---

## Development Mode

For development with hot-reload:
```bash
docker-compose -f docker-compose.dev.yml up
```

---

## Token Detection

**Status**: ⚠️ Specified but not implemented yet

See `TOKEN_DETECTION_STATUS.md` for details.

---

**Ready to explore!** 🎉

