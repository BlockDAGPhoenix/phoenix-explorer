# 🏗️ Architecture: One-Command Cryptocurrency Stack

**Role**: Software Architect  
**Date**: January 2025  
**Status**: Analysis & Recommendations

---

## Executive Summary

To achieve a **one-command cryptocurrency stack** that revolutionizes running a cryptocurrency, we need to orchestrate:

1. **Phoenix Node** (Blockchain node)
2. **Phoenix Explorer** (Block explorer)
3. **Supporting Infrastructure** (Database, Cache, etc.)

This document provides architectural analysis and recommendations without implementation.

---

## Current State Analysis

### ✅ What Exists

1. **Phoenix Explorer** (`phoenix-explorer/`)
   - ✅ Complete Docker Compose setup
   - ✅ One-command start: `make up`
   - ✅ Services: PostgreSQL, Redis, API, Frontend, Indexer
   - ✅ Ports: 6660-6666 range

2. **Phoenix Node** (`phoenix-node/`)
   - ✅ Go-based blockchain node
   - ✅ Dockerfile exists (`docker/Dockerfile`)
   - ✅ RPC API on port 16110 (default)
   - ✅ P2P on port 16111 (default)
   - ✅ Testnet setup scripts exist

### ❌ What's Missing

1. **Unified Orchestration**
   - Phoenix Node not integrated into Explorer's docker-compose
   - No single command to start everything
   - Separate startup processes

2. **Service Discovery**
   - Explorer expects Phoenix Node at `host.docker.internal:8545`
   - No automatic configuration
   - Manual environment variable setup required

3. **Initialization Sequence**
   - No guaranteed startup order
   - No health checks between services
   - No migration auto-run verification

---

## Architecture Requirements

### Goal: One Command to Rule Them All

```bash
make phoenix  # Starts everything: Node + Explorer + Infrastructure
```

### Required Components

```
┌─────────────────────────────────────────────────────────┐
│              Phoenix Cryptocurrency Stack                │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐    ┌──────────────┐                  │
│  │ Phoenix Node │───▶│   Explorer   │                  │
│  │  (Blockchain)│    │  (Frontend)  │                  │
│  └──────┬───────┘    └──────┬───────┘                  │
│         │                    │                           │
│         │                    │                           │
│    ┌────▼────┐         ┌────▼────┐                      │
│    │   RPC   │         │  Indexer│                      │
│    │  :16110 │         │   (Go)  │                      │
│    └─────────┘         └────┬───┘                      │
│                              │                           │
│                         ┌────▼────┐                      │
│                         │PostgreSQL│                     │
│                         │  :6660  │                      │
│                         └─────────┘                      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

---

## Architectural Recommendations

### 1. Unified Docker Compose Architecture

**Recommendation**: Create a master `docker-compose.yml` that includes:

```yaml
services:
  # Blockchain Node
  phoenix-node:
    - RPC: 16110
    - P2P: 16111
    - Data persistence
    - Health checks
    
  # Explorer Stack (existing)
  postgres:
  redis:
  api:
  frontend:
  indexer:
```

**Benefits**:
- Single orchestration file
- Automatic service discovery
- Coordinated startup/shutdown
- Shared network for inter-service communication

**Challenges**:
- Phoenix Node may need significant disk space (50GB+)
- Node sync time (may take hours/days)
- Resource requirements (RAM, CPU)

---

### 2. Service Discovery & Configuration

**Current Problem**: Explorer hardcodes `host.docker.internal:8545`

**Recommendation**: Use Docker service names

```yaml
# Explorer connects to:
PHOENIX_RPC_URL=http://phoenix-node:16110

# Not:
PHOENIX_RPC_URL=http://host.docker.internal:8545
```

**Benefits**:
- Works in Docker network
- No host machine dependency
- Automatic DNS resolution
- Works on any platform (Linux, macOS, Windows)

---

### 3. Startup Sequence & Dependencies

**Recommendation**: Implement proper dependency chain

```
1. Infrastructure (PostgreSQL, Redis)
   ↓
2. Phoenix Node (must be ready)
   ↓
3. Indexer (needs Node + Database)
   ↓
4. API (needs Database + Indexer)
   ↓
5. Frontend (needs API)
```

**Implementation Strategy**:
- Use `depends_on` with `condition: service_healthy`
- Health checks for each service
- Retry logic for Node RPC connection
- Graceful degradation if Node not ready

---

### 4. Data Persistence Strategy

**Recommendation**: Separate volumes for different data types

```yaml
volumes:
  # Node blockchain data (large, grows over time)
  phoenix_node_data:
    driver: local
    driver_opts:
      type: none
      device: /path/to/large/disk  # Optional: mount large disk
  
  # Explorer database (smaller, structured)
  postgres_data:
  
  # Explorer cache
  redis_data:
```

**Considerations**:
- Node data: 50GB+ (grows continuously)
- Database: ~10GB (depends on indexing depth)
- Redis: ~1GB (cache, can be cleared)

---

### 5. Port Management

**Current State**:
- Phoenix Node: 16110 (RPC), 16111 (P2P)
- Explorer: 6660-6666 range

**Recommendation**: Keep separate port ranges

```
Phoenix Node:
  - RPC: 16110 (internal), 16110 (external)
  - P2P: 16111 (internal), 16111 (external)

Explorer:
  - PostgreSQL: 6660
  - Redis: 6661
  - API: 6662
  - Frontend: 6663
  - Reserved: 6664-6666
```

**Rationale**:
- Node ports are standard (16110/16111)
- Explorer ports are custom (6660-6666)
- No conflicts
- Clear separation of concerns

---

### 6. Health Checks & Readiness

**Recommendation**: Implement comprehensive health checks

```yaml
phoenix-node:
  healthcheck:
    test: ["CMD", "curl", "-f", "http://localhost:16110/health"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s  # Node takes time to start

indexer:
  healthcheck:
    test: ["CMD", "pg_isready", "-U", "phoenix"]
    depends_on:
      phoenix-node:
        condition: service_healthy
      postgres:
        condition: service_healthy
```

**Benefits**:
- Services wait for dependencies
- Automatic recovery
- Clear startup status
- Better error messages

---

### 7. Configuration Management

**Recommendation**: Single `.env` file for entire stack

```env
# Phoenix Node
PHOENIX_NODE_RPC_PORT=16110
PHOENIX_NODE_P2P_PORT=16111
PHOENIX_NODE_DATADIR=/data/phoenix-node
PHOENIX_NODE_NETWORK=testnet  # or mainnet

# Explorer
PHOENIX_RPC_URL=http://phoenix-node:16110
DATABASE_URL=postgresql://phoenix:phoenix_dev@postgres:5432/phoenix_explorer
REDIS_URL=redis://redis:6379
```

**Benefits**:
- Single source of truth
- Easy environment switching (testnet/mainnet)
- Version controlled (via `.env.example`)
- No hardcoded values

---

### 8. Makefile Command Design

**Recommendation**: Intuitive command structure

```makefile
# One command to start everything
phoenix: up

# Start everything
up:
	docker-compose up -d
	@echo "✅ Phoenix Stack Started!"
	@echo "  Node RPC: http://localhost:16110"
	@echo "  Explorer: http://localhost:6663"

# Stop everything
down:
	docker-compose down

# View all logs
logs:
	docker-compose logs -f

# Check status
status:
	docker-compose ps
```

**User Experience**:
```bash
make phoenix    # Start everything
make logs       # See what's happening
make status     # Check health
make down       # Stop everything
```

---

## Implementation Considerations

### Challenge 1: Node Sync Time

**Problem**: Phoenix Node may take hours/days to sync

**Recommendations**:
1. **Fast Sync Option**: Use `--fastsync` flag if available
2. **Snapshot Support**: Provide pre-synced snapshots
3. **Progress Indicator**: Show sync status in logs
4. **Explorer Degradation**: Explorer works with partial sync

### Challenge 2: Resource Requirements

**Problem**: Full stack needs significant resources

**Recommendations**:
1. **Resource Limits**: Set Docker resource limits
2. **Light Mode**: Option to run lightweight node
3. **Documentation**: Clear minimum requirements
4. **Monitoring**: Resource usage dashboard

### Challenge 3: Platform Compatibility

**Problem**: Docker networking differs by platform

**Recommendations**:
1. **Docker Network**: Use bridge network (works everywhere)
2. **Service Names**: Use Docker DNS (cross-platform)
3. **Testing**: Test on Linux, macOS, Windows
4. **Documentation**: Platform-specific notes

### Challenge 4: Data Persistence

**Problem**: Node data is large and persistent

**Recommendations**:
1. **Volume Mounting**: Allow external volume mounting
2. **Data Directory**: Configurable data directory
3. **Backup Strategy**: Document backup procedures
4. **Cleanup**: Provide data cleanup commands

---

## Recommended Architecture

### File Structure

```
phoenix-explorer/
├── docker-compose.yml          # Unified orchestration
├── docker-compose.node.yml     # Node-specific config (optional)
├── .env.example                # Complete environment template
├── Makefile                    # One-command interface
├── scripts/
│   ├── init-node.sh           # Node initialization
│   ├── check-health.sh        # Health check script
│   └── setup-volumes.sh       # Volume setup
└── docs/
    └── ONE_COMMAND_SETUP.md   # User guide
```

### Service Dependencies

```
phoenix-node (no dependencies)
    ↓
postgres (no dependencies)
    ↓
redis (no dependencies)
    ↓
indexer (depends on: phoenix-node, postgres)
    ↓
api (depends on: postgres, redis, indexer)
    ↓
frontend (depends on: api)
```

---

## Success Criteria

### Functional Requirements

- ✅ Single command starts entire stack
- ✅ All services communicate correctly
- ✅ Health checks pass
- ✅ Data persists across restarts
- ✅ Works on Linux, macOS, Windows

### Non-Functional Requirements

- ✅ Startup time < 5 minutes (excluding node sync)
- ✅ Clear error messages
- ✅ Comprehensive logging
- ✅ Resource usage documented
- ✅ Easy cleanup/restart

---

## Risks & Mitigations

### Risk 1: Node Sync Time

**Mitigation**: 
- Provide fast-sync option
- Show clear progress indicators
- Allow explorer to work with partial sync

### Risk 2: Resource Exhaustion

**Mitigation**:
- Set resource limits
- Document requirements clearly
- Provide lightweight mode

### Risk 3: Port Conflicts

**Mitigation**:
- Use configurable ports
- Check ports before startup
- Clear error messages

### Risk 4: Data Loss

**Mitigation**:
- Persistent volumes
- Backup documentation
- Clear data directory structure

---

## Next Steps (For Implementation)

1. **Phase 1: Integration**
   - Add Phoenix Node to docker-compose.yml
   - Configure service discovery
   - Update environment variables

2. **Phase 2: Health Checks**
   - Implement health checks
   - Add dependency chains
   - Create status command

3. **Phase 3: User Experience**
   - Create unified Makefile
   - Write documentation
   - Add progress indicators

4. **Phase 4: Testing**
   - Test on all platforms
   - Verify resource usage
   - Test failure scenarios

---

## Conclusion

**Architectural Recommendation**: 

Create a **unified Docker Compose orchestration** that includes Phoenix Node and Explorer in a single stack, with proper service discovery, health checks, and dependency management.

**Key Principles**:
1. **Simplicity**: One command, one file
2. **Reliability**: Health checks, dependencies
3. **Flexibility**: Configurable, extensible
4. **Documentation**: Clear, comprehensive

**Estimated Complexity**: Medium
- Docker Compose integration: Low complexity
- Health checks: Medium complexity
- Cross-platform testing: Medium complexity

**Timeline**: 1-2 days for basic integration, 1 week for production-ready

---

**Status**: ✅ Analysis Complete  
**Next**: Implementation (when approved)

