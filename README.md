# Phoenix Explorer

Block explorer for Phoenix Network BlockDAG, based on Blockscout with DAG-specific enhancements.

## Status

**Current Phase**: Specifications Complete - Ready for Implementation

✅ **NEW: Custom Explorer Specifications Created**  
Complete technical specifications for a Kaspa-inspired custom explorer are now available. See [specs/README.md](./specs/README.md) for the full custom implementation plan.

## Overview

Phoenix Explorer provides comprehensive visualization and analysis of the Phoenix Network BlockDAG, including:

- **DAG Visualization**: Interactive graph showing block relationships
- **Block Browser**: Browse blocks with parent information
- **Blue Score Display**: Phoenix-specific block ordering
- **Smart Contract Verification**: Verify and interact with contracts
- **Token Tracking**: ERC-20, ERC-721, ERC-1155 support
- **REST API**: Programmatic access to explorer data

## Documentation

### 🎯 **RECOMMENDED: Custom Explorer Specifications** (NEW)

Complete specifications for building a custom Kaspa-inspired explorer:

- **[specs/README.md](./specs/README.md)** - ⭐ **START HERE** - Overview and quick start
- **[specs/CUSTOM_EXPLORER_SPECIFICATION.md](./specs/CUSTOM_EXPLORER_SPECIFICATION.md)** - Complete system spec
- **[specs/DATABASE_SCHEMA.md](./specs/DATABASE_SCHEMA.md)** - Full database design (20+ tables)
- **[specs/API_SPECIFICATION.md](./specs/API_SPECIFICATION.md)** - REST & WebSocket API (30+ endpoints)
- **[specs/INDEXER_SPECIFICATION.md](./specs/INDEXER_SPECIFICATION.md)** - Go indexer implementation

**Key Features**:
- ✅ DAG-native architecture (no linear chain assumptions)
- ✅ Clean architecture principles
- ✅ Technology stack: Go + Node.js + PostgreSQL + Redis + React
- ✅ Complete implementation roadmap (24 weeks)
- ✅ Cost estimates ($85K dev + $760/month infrastructure)

---

### 🚨 Technology Decision Documents

**Specification Conflict Identified**: The main BlockDAG documentation specifies a custom explorer, but this repository previously specified Blockscout.

- **[DECISION_MATRIX.md](./DECISION_MATRIX.md)** - Quick decision guide and comparison
- **[EXPLORER_OPTIONS_ANALYSIS.md](./EXPLORER_OPTIONS_ANALYSIS.md)** - Comprehensive analysis
  - Blockscout vs Custom vs Kaspa Fork
  - Recommendation: Custom explorer (now fully specified above)

---

### 📋 Implementation Documents (Assumes Blockscout - Alternative Approach)

These documents assume the Blockscout approach (not recommended):

- **[EXECUTIVE_SUMMARY.md](./EXECUTIVE_SUMMARY.md)** - Quick overview
- **[ARCHITECTURE_ASSESSMENT.md](./ARCHITECTURE_ASSESSMENT.md)** - Technical assessment
- **[IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)** - Task breakdown
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Comparison with specs
- **[docs/specs/BLOCKSCOUT.md](./docs/specs/BLOCKSCOUT.md)** - Blockscout specifications

## Implementation Status

### Current State
- ✅ Repository structure
- ✅ Specifications documented
- ❌ Blockscout fork (not started)
- ❌ DAG features (not started)
- ❌ Phoenix RPC integration (not started)

### Next Steps
1. Fork Blockscout repository
2. Set up development environment
3. Configure Phoenix RPC connection
4. Implement DAG-specific features

See [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) for detailed tasks.

## Technology Stack

- **Backend**: Elixir/Phoenix
- **Frontend**: React/TypeScript
- **Database**: PostgreSQL
- **Cache**: Redis
- **Base**: Blockscout (GPL-3.0)

## Development

### Prerequisites
- Elixir 1.14+ / OTP 25+
- PostgreSQL 12+
- Redis 6+
- Node.js 18+
- Docker & Docker Compose

### Setup
```bash
# Clone repository
git clone https://github.com/BlockDAGPhoenix/phoenix-explorer.git
cd phoenix-explorer

# Set up environment
cp .env.example .env
# Edit .env with Phoenix RPC URL

# Start services
docker-compose up -d

# Run migrations
mix ecto.migrate

# Start development server
mix phx.server
```

## License

GPL-3.0 (inherited from Blockscout)

## Links

- **Phoenix Network**: https://phoenix.network
- **Documentation**: https://docs.phoenix.network
- **Blockscout**: https://github.com/blockscout/blockscout
