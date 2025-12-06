# Phoenix Explorer Architecture Assessment

**Date**: January 2025  
**Status**: Planning Phase  
**Base**: Blockscout Fork

## Executive Summary

The phoenix-explorer project is currently a skeleton repository that needs to be fully implemented as a Blockscout-based block explorer customized for Phoenix Network's BlockDAG architecture. This document outlines what needs to be implemented based on the specifications and compares it with BlockDAG requirements.

## Current State

### Repository Status
- ✅ Basic structure exists (README, docker-compose.yml, specs)
- ✅ Agent instructions defined
- ✅ Specification document exists (`docs/specs/BLOCKSCOUT.md`)
- ❌ **No actual Blockscout fork/clone**
- ❌ **No code implementation**
- ❌ **No DAG visualization components**
- ❌ **No Phoenix-specific customizations**

### Files Present
```
phoenix-explorer/
├── README.md (minimal - just title)
├── AGENT_INSTRUCTIONS.md (task breakdown)
├── BLOCKSCOUT_SETUP.md (empty)
├── PHOENIX_CONFIG.md (empty)
├── docker-compose.yml (needs review)
├── docs/specs/BLOCKSCOUT.md (specification)
└── LICENSE (needs to be GPL-3.0 for Blockscout)
```

## What Needs to Be Implemented

### 1. Base Blockscout Fork

**Action Required**: Fork Blockscout repository
- **Upstream**: https://github.com/blockscout/blockscout
- **License**: GPL-3.0 (must be maintained)
- **Technology Stack**:
  - Backend: Elixir/Phoenix
  - Frontend: React/TypeScript
  - Database: PostgreSQL
  - Cache: Redis
  - Indexer: Elixir-based chain indexer

**Implementation Steps**:
1. Clone Blockscout repository
2. Create Phoenix-specific branch
3. Update branding (logo, colors, name)
4. Configure for Phoenix network parameters
5. Set up build system and dependencies

### 2. Phoenix Network Integration

#### 2.1 RPC Configuration

**Phoenix RPC Endpoints** (from phoenix-node):
- Standard Ethereum JSON-RPC (EIP-1474):
  - `eth_blockNumber` - Returns blue score as block number
  - `eth_getBalance`
  - `eth_getCode`
  - `eth_call`
  - `eth_sendTransaction`
  - `eth_getTransactionReceipt`
  - `eth_getLogs`
  - `eth_getBlockByNumber`
  - `eth_getBlockByHash`
  - `eth_gasPrice`
  - `eth_estimateGas`

- Phoenix-Specific Extensions:
  - `phoenix_getDAGInfo` - Get DAG information
  - `phoenix_getBlueScore` - Get blue score for block
  - `phoenix_getBlockParents` - Get parent blocks (DAG structure)

**Configuration Needed**:
```elixir
# config/config.exs
config :explorer,
  json_rpc_named_arguments: [
    transport: EthereumJSONRPC.HTTP,
    transport_options: [
      http: EthereumJSONRPC.HTTP.HTTPoison,
      url: System.get_env("PHOENIX_RPC_URL", "http://localhost:16110"),
      method_to_url: [
        eth_call: System.get_env("PHOENIX_RPC_URL", "http://localhost:16110"),
        eth_getBalance: System.get_env("PHOENIX_RPC_URL", "http://localhost:16110"),
        phoenix_getDAGInfo: System.get_env("PHOENIX_RPC_URL", "http://localhost:16110"),
        phoenix_getBlockParents: System.get_env("PHOENIX_RPC_URL", "http://localhost:16110")
      ],
      http_options: [recv_timeout: 60_000, timeout: 60_000]
    ]
  ]
```

#### 2.2 Chain Configuration

**Phoenix Network Parameters**:
- Chain ID: TBD (needs to be defined)
- Network Name: Phoenix Mainnet / Phoenix Testnet
- Currency: PHX (or TBD)
- Block Time: ~1 second (Kaspa-based)
- Consensus: GHOSTDAG

**Configuration File**: `config/chains/phoenix.toml`
```toml
[chain]
name = "Phoenix"
short_name = "PHX"
native_currency_name = "Phoenix"
native_currency_symbol = "PHX"
native_currency_decimals = 18
rpc_http_url = "http://localhost:16110"
rpc_ws_url = "ws://localhost:16111"
block_seconds = 1
```

### 3. DAG-Specific Features

#### 3.1 Database Schema Extensions

**New Tables Needed**:
```sql
-- Block DAG metadata (non-canonical)
CREATE TABLE block_dag_metadata (
  block_hash VARCHAR(66) PRIMARY KEY,
  parent_hashes TEXT[], -- Array of parent block hashes
  blue_score BIGINT,
  is_blue BOOLEAN, -- Blue set indicator
  is_red BOOLEAN, -- Red set indicator
  merge_set_blues TEXT[], -- Blue blocks in merge set
  merge_set_reds TEXT[], -- Red blocks in merge set
  created_at TIMESTAMP DEFAULT NOW()
);

-- DAG relationships for visualization
CREATE TABLE dag_relationships (
  child_hash VARCHAR(66),
  parent_hash VARCHAR(66),
  PRIMARY KEY (child_hash, parent_hash)
);
CREATE INDEX idx_dag_relationships_child ON dag_relationships(child_hash);
CREATE INDEX idx_dag_relationships_parent ON dag_relationships(parent_hash);
```

#### 3.2 Indexer Extensions

**New Indexer Tasks**:
1. **DAG Metadata Indexer**: Fetches parent blocks via `phoenix_getBlockParents`
2. **Blue/Red Set Indexer**: Tracks which blocks are in blue vs red sets
3. **DAG Relationship Builder**: Builds parent-child relationships for visualization

**Implementation Location**: `apps/indexer/lib/indexer/`

**New Indexer Module**: `apps/indexer/lib/indexer/dag_metadata_fetcher.ex`
```elixir
defmodule Indexer.DAGMetadataFetcher do
  @moduledoc """
  Fetches DAG-specific metadata from Phoenix RPC
  """
  
  def fetch_block_parents(block_hash) do
    # Call phoenix_getBlockParents RPC method
  end
  
  def fetch_block_dag_info(block_hash) do
    # Call phoenix_getDAGInfo for blue/red set info
  end
end
```

#### 3.3 API Extensions

**New REST Endpoints** (add to `apps/block_scout_web/lib/block_scout_web/api/v1/`):

1. **Get Block Parents**:
   ```
   GET /api/v1/blocks/{block_hash}/parents
   ```
   Returns: `{ "parents": ["0x...", "0x..."], "blue_score": 12345 }`

2. **Get DAG Visualization Data**:
   ```
   GET /api/v1/blocks/{block_hash}/dag
   ```
   Returns: `{ "block": {...}, "parents": [...], "children": [...], "is_blue": true }`

3. **Get Blue Score**:
   ```
   GET /api/v1/blocks/{block_hash}/blue_score
   ```
   Returns: `{ "blue_score": 12345 }`

#### 3.4 Frontend DAG Visualization

**New React Components** (in `apps/block_scout_web/assets/js/components/`):

1. **DAGGraph Component** (`DAGGraph.tsx`):
   - Interactive graph visualization using D3.js or vis.js
   - Shows block nodes with parent-child relationships
   - Color coding: Blue blocks (blue), Red blocks (red)
   - Zoom and pan controls
   - Click to view block details

2. **BlockParentsList Component** (`BlockParentsList.tsx`):
   - Lists parent blocks for a given block
   - Shows blue/red indicators
   - Links to parent block pages

3. **DAGView Page** (`DAGView.tsx`):
   - Full-page DAG visualization
   - Filter by blue score range
   - Search for specific blocks
   - Export DAG as image/JSON

**Dependencies to Add**:
```json
{
  "d3": "^7.8.0",
  "vis-network": "^9.1.0",
  "@types/d3": "^7.4.0"
}
```

### 4. Blockscout Standard Features (Already Included)

These come with Blockscout and need configuration only:

- ✅ Block browser
- ✅ Transaction explorer
- ✅ Address pages
- ✅ Smart contract verification
- ✅ Token tracking (ERC-20, ERC-721, ERC-1155)
- ✅ Event log browsing
- ✅ Internal transaction tracking
- ✅ Gas price tracking
- ✅ REST API
- ✅ GraphQL API (optional)

### 5. Phoenix Branding & Customization

#### 5.1 Visual Identity

**Colors** (from Phoenix brand guidelines):
- Primary: Phoenix Orange/Red (TBD exact hex)
- Secondary: Dark background
- Accent: Gold/Yellow highlights

**Logo**: Replace Blockscout logo with Phoenix logo

**Files to Customize**:
- `apps/block_scout_web/assets/css/app.css`
- `apps/block_scout_web/lib/block_scout_web/templates/layout/app.html.eex`
- `apps/block_scout_web/assets/static/images/` (logos)

#### 5.2 Terminology Updates

- "Block Height" → "Blue Score" (where appropriate)
- Add "DAG View" to navigation
- Update footer/copyright to Phoenix Network

### 6. Performance Requirements

**From Specification**:
- Indexer lag: < 10 seconds behind tip
- Pagination: Standard Blockscout pagination
- Caching: Redis caching per Blockscout best practices

**Optimization Areas**:
1. DAG metadata queries (may be expensive)
2. DAG visualization rendering (large graphs)
3. Parent block lookups (multiple queries per block)

### 7. Deployment Configuration

#### 7.1 Docker Compose

**Current State**: `docker-compose.yml` exists but needs review

**Required Services**:
- PostgreSQL (database)
- Redis (cache)
- Blockscout indexer (Elixir)
- Blockscout web (Phoenix/React)
- (Optional) Prometheus/Grafana for monitoring

#### 7.2 Environment Variables

**Required Env Vars**:
```bash
# Phoenix RPC
PHOENIX_RPC_URL=http://localhost:16110
PHOENIX_RPC_WS_URL=ws://localhost:16111

# Database
DATABASE_URL=postgresql://user:pass@postgres:5432/blockscout

# Redis
REDIS_URL=redis://redis:6379

# Chain Config
CHAIN_ID=12345  # TBD
NETWORK_NAME=Phoenix Mainnet

# Branding
LOGO_PATH=/images/phoenix-logo.png
```

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Fork Blockscout repository
- [ ] Set up development environment
- [ ] Configure Phoenix RPC endpoints
- [ ] Update branding (logo, colors, name)
- [ ] Configure chain parameters
- [ ] Test basic block/transaction indexing

### Phase 2: DAG Extensions - Backend (Week 3-4)
- [ ] Create database schema for DAG metadata
- [ ] Implement DAG metadata indexer
- [ ] Add Phoenix RPC method handlers
- [ ] Create API endpoints for DAG data
- [ ] Add blue/red set tracking
- [ ] Test indexer with Phoenix testnet

### Phase 3: DAG Extensions - Frontend (Week 5-6)
- [ ] Create DAG visualization component
- [ ] Add block parents list component
- [ ] Create DAG view page
- [ ] Integrate DAG components into block pages
- [ ] Add blue/red indicators throughout UI
- [ ] Test visualization with real DAG data

### Phase 4: Integration & Testing (Week 7-8)
- [ ] End-to-end testing
- [ ] Performance optimization
- [ ] Load testing
- [ ] Security review
- [ ] Documentation completion
- [ ] Docker deployment setup

### Phase 5: Production Readiness (Week 9-10)
- [ ] Production deployment configuration
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Error tracking (Sentry)
- [ ] Backup procedures
- [ ] Documentation finalization
- [ ] Launch preparation

## Comparison with BlockDAG Requirements

### What BlockDAG Specifies (from docs)

**User Guide Requirements** (from `phoenix-docs/docs/user-guides/explorer.md`):
- ✅ DAG Visualization (interactive graph)
- ✅ Block Browser (with parent blocks)
- ✅ Blue Score display
- ✅ Transaction explorer
- ✅ Smart contract verification
- ✅ Token tracking
- ✅ Search functionality
- ✅ API access

**API Requirements** (from `phoenix-docs/docs/api-reference/explorer-api.md`):
- ✅ REST API endpoints
- ✅ Block endpoints
- ✅ Transaction endpoints
- ✅ Address endpoints
- ✅ Token endpoints

**Specification Requirements** (from `docs/specs/BLOCKSCOUT.md`):
- ✅ Full EVM explorer functionality
- ✅ DAG-aware additions
- ✅ Block parents visualization
- ✅ Blue/red set indicators
- ✅ Contract verification
- ✅ Performance targets (< 10s lag)

### Gaps Identified

1. **No actual Blockscout fork** - Repository is empty
2. **No DAG visualization implementation** - Needs to be built
3. **No Phoenix RPC integration** - Needs custom RPC client
4. **No database schema for DAG** - Needs new tables
5. **No API endpoints for DAG** - Needs new REST endpoints
6. **No frontend components** - All need to be created
7. **No deployment configuration** - Docker setup incomplete

## Technical Challenges

### 1. DAG Visualization Performance
**Challenge**: Rendering large DAGs (thousands of blocks) in browser
**Solution**: 
- Use efficient graph libraries (vis-network or D3 force-directed)
- Implement viewport culling (only render visible nodes)
- Lazy loading of DAG data
- Limit initial view to recent blocks

### 2. Non-Canonical Block Storage
**Challenge**: Blockscout assumes linear chain, Phoenix has DAG
**Solution**:
- Store all blocks (not just canonical)
- Use `block_dag_metadata` table for DAG relationships
- Indexer tracks all blocks, not just selected parent chain
- UI shows canonical blocks by default, with option to view all

### 3. Blue Score vs Block Number
**Challenge**: Blockscout uses block number, Phoenix uses blue score
**Solution**:
- Map blue score to block number in indexer
- Display blue score prominently
- Use blue score for ordering/sorting
- Maintain compatibility with Blockscout's block number field

### 4. Parent Block Queries
**Challenge**: Each block has multiple parents (DAG structure)
**Solution**:
- Batch RPC calls for parent blocks
- Cache parent relationships in database
- Use efficient queries with array columns (PostgreSQL)

## Dependencies & Prerequisites

### External Dependencies
- Phoenix Node running and accessible via RPC
- PostgreSQL 12+ database
- Redis 6+ cache
- Node.js 18+ (for frontend build)
- Elixir 1.14+ / OTP 25+ (for backend)

### Internal Dependencies
- Phoenix Node RPC endpoints must be implemented
- Phoenix network parameters must be defined
- Chain ID must be assigned

## Success Criteria

### Functional Requirements
- [ ] All Blockscout standard features working
- [ ] DAG visualization displays correctly
- [ ] Block parents are shown for all blocks
- [ ] Blue/red indicators are accurate
- [ ] API endpoints return correct DAG data
- [ ] Indexer stays < 10 seconds behind tip

### Non-Functional Requirements
- [ ] Page load time < 2 seconds
- [ ] DAG visualization renders < 5 seconds for 1000 blocks
- [ ] API response time < 500ms (p95)
- [ ] 99.9% uptime target
- [ ] Mobile-responsive design

## Next Steps

1. **Immediate Actions**:
   - Fork Blockscout repository into phoenix-explorer
   - Set up development environment
   - Configure Phoenix RPC connection
   - Test basic indexing

2. **Short-term (Week 1-2)**:
   - Complete Phase 1 (Foundation)
   - Begin Phase 2 (DAG Backend)

3. **Medium-term (Month 1)**:
   - Complete Phases 2-3 (DAG Extensions)
   - Begin Phase 4 (Integration)

4. **Long-term (Month 2-3)**:
   - Complete Phase 5 (Production)
   - Launch on testnet
   - Prepare for mainnet

## Conclusion

The phoenix-explorer project is currently a **skeleton** that needs full implementation. It is **not** a clone of Blockscout yet - it needs to be forked and customized. The main work involves:

1. **Forking Blockscout** (foundation)
2. **Adding DAG-specific features** (differentiation)
3. **Integrating with Phoenix RPC** (integration)
4. **Customizing branding** (identity)

This is a substantial project requiring approximately **8-10 weeks** of development time with a team of 2-3 developers.

---

**Document Status**: Draft  
**Last Updated**: January 2025  
**Next Review**: After Phase 1 completion

