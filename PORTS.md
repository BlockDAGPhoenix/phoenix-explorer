# Port Configuration

## Port Assignment (6660-6666)

| Service | External Port | Internal Port | URL |
|---------|--------------|---------------|-----|
| PostgreSQL | 6660 | 5432 | `localhost:6660` |
| Redis | 6661 | 6379 | `localhost:6661` |
| API | 6662 | 3000 | `http://localhost:6662` |
| Frontend | 6663 | 3000 | `http://localhost:6663` |
| Reserved | 6664-6666 | - | - |

## Access Points

- **Frontend**: http://localhost:6663
- **API**: http://localhost:6662
- **API Health**: http://localhost:6662/health
- **WebSocket**: ws://localhost:6662/ws
- **PostgreSQL**: localhost:6660
- **Redis**: localhost:6661

## Environment Variables

When configuring environment variables, use the external ports:

```env
# Frontend
NEXT_PUBLIC_API_URL=http://localhost:6662
NEXT_PUBLIC_WS_URL=ws://localhost:6662/ws

# API
CORS_ORIGIN=http://localhost:6663
DATABASE_URL=postgresql://phoenix:phoenix_dev@postgres:5432/phoenix_explorer?sslmode=disable
REDIS_URL=redis://redis:6379
```

**Note**: Inside Docker containers, use internal ports (5432, 6379, 3000).  
**Note**: From host machine, use external ports (6660-6663).

## Changing Ports

To change ports, edit `docker-compose.yml`:

```yaml
services:
  postgres:
    ports:
      - "NEW_PORT:5432"  # Change NEW_PORT
```

Then update all documentation and environment variables accordingly.

