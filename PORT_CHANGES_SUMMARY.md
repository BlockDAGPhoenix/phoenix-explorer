# Port Changes Summary

## ✅ All Ports Updated to 6660-6666

All documentation and configuration files have been updated to use ports 6660-6666.

---

## Port Mapping

| Service | External Port | Internal Port | Description |
|---------|--------------|---------------|-------------|
| PostgreSQL | **6660** | 5432 | Database |
| Redis | **6661** | 6379 | Cache |
| API | **6662** | 3000 | REST API |
| Frontend | **6663** | 3000 | Web UI |
| Reserved | 6664-6666 | - | Available for future use |

---

## Updated Files

### Configuration Files
- ✅ `docker-compose.yml` - All port mappings updated
- ✅ `.env.example` - Environment variables updated
- ✅ `Makefile` - Port references updated

### Documentation Files
- ✅ `README_DOCKER.md` - All port references updated
- ✅ `QUICK_START.md` - All port references updated
- ✅ `EXPLORER_COMPLETE.md` - Port references updated
- ✅ `WEBSOCKET_COMPLETE.md` - WebSocket URL updated
- ✅ `packages/frontend/README.md` - Port references updated
- ✅ `packages/api/README.md` - Port references updated
- ✅ `specs/README.md` - Port references updated
- ✅ `specs/API_SPECIFICATION.md` - Port references updated
- ✅ `specs/INDEXER_SPECIFICATION.md` - Port references updated

### New Files
- ✅ `PORTS.md` - Complete port configuration documentation

---

## Access URLs

### Before (Old Ports)
- Frontend: http://localhost:3001
- API: http://localhost:3000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### After (New Ports)
- Frontend: **http://localhost:6663**
- API: **http://localhost:6662**
- PostgreSQL: **localhost:6660**
- Redis: **localhost:6661**

---

## Environment Variables

### Updated Defaults
```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:6662
NEXT_PUBLIC_WS_URL=ws://localhost:6662/ws

# API
CORS_ORIGIN=http://localhost:6663
```

---

## Docker Compose Changes

### Port Mappings
```yaml
postgres:
  ports:
    - "6660:5432"  # Changed from 5432:5432

redis:
  ports:
    - "6661:6379"  # Changed from 6379:6379

api:
  ports:
    - "6662:3000"  # Changed from 3000:3000

frontend:
  ports:
    - "6663:3000"  # Changed from 3001:3000
```

---

## Verification

To verify all changes:

```bash
# Check docker-compose.yml
grep -E "666[0-6]" docker-compose.yml

# Check documentation
grep -r "localhost:666[0-6]" --include="*.md" .

# Check environment files
grep -E "666[0-6]" .env.example
```

---

## Next Steps

1. ✅ All ports updated
2. ✅ All documentation updated
3. ✅ All configuration files updated
4. ✅ Ready to use!

**Start the explorer:**
```bash
make up
```

**Access:**
- Frontend: http://localhost:6663
- API: http://localhost:6662

---

**Status**: ✅ Complete  
**All ports**: Updated to 6660-6666

