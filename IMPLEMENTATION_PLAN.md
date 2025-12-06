# Phoenix Explorer - Detailed Implementation Plan

**Version**: 1.0  
**Date**: January 2025  
**Methodology**: Test-Driven Development (TDD) + SOLID Principles  
**Duration**: 24 Weeks

---

## 1. Core Principles

### 1.1 Test-Driven Development (TDD)

**Red-Green-Refactor Cycle**:
```
1. RED:    Write failing test first
2. GREEN:  Write minimal code to pass test
3. REFACTOR: Improve code while keeping tests green
4. REPEAT: For each feature/function
```

**Testing Pyramid**:
```
       /\
      /  \    E2E Tests (10%)
     /____\
    /      \  Integration Tests (30%)
   /________\
  /          \ Unit Tests (60%)
 /____________\
```

**Coverage Target**: 80%+ across all components

### 1.2 Interface Segregation Principle (ISP)

**Key ISP Rules**:
1. No client should depend on interfaces it doesn't use
2. Many small, specific interfaces > One large, general interface
3. Each interface should have a single, well-defined purpose
4. Clients should only implement what they need

**Example**:
```typescript
// BAD: Fat interface
interface DataStore {
  saveBlock(block: Block): Promise<void>;
  saveTransaction(tx: Transaction): Promise<void>;
  saveContract(contract: Contract): Promise<void>;
  getBlock(hash: string): Promise<Block>;
  getTransaction(hash: string): Promise<Transaction>;
  getContract(address: string): Promise<Contract>;
}

// GOOD: Segregated interfaces
interface BlockWriter {
  saveBlock(block: Block): Promise<void>;
}

interface BlockReader {
  getBlock(hash: string): Promise<Block>;
}

interface TransactionWriter {
  saveTransaction(tx: Transaction): Promise<void>;
}

interface TransactionReader {
  getTransaction(hash: string): Promise<Transaction>;
}
```

---

## 2. Project Structure

### 2.1 Repository Organization

```
phoenix-explorer/
├── packages/
│   ├── indexer/              # Go indexer service
│   │   ├── cmd/
│   │   │   ├── indexer/      # Main indexer binary
│   │   │   └── migrate/      # Database migrations
│   │   ├── pkg/
│   │   │   ├── rpc/          # Phoenix RPC client
│   │   │   ├── indexer/      # Indexing logic
│   │   │   ├── database/     # Database access
│   │   │   └── domain/       # Domain models
│   │   ├── internal/
│   │   │   └── testutil/     # Testing utilities
│   │   └── tests/
│   │       ├── unit/         # Unit tests
│   │       └── integration/  # Integration tests
│   │
│   ├── api/                  # Node.js API service
│   │   ├── src/
│   │   │   ├── interfaces/   # Interface definitions (ISP)
│   │   │   ├── domain/       # Domain models
│   │   │   ├── repositories/ # Data access
│   │   │   ├── services/     # Business logic
│   │   │   ├── controllers/  # HTTP controllers
│   │   │   ├── middleware/   # Express middleware
│   │   │   └── websocket/    # WebSocket server
│   │   ├── tests/
│   │   │   ├── unit/         # Unit tests
│   │   │   ├── integration/  # Integration tests
│   │   │   └── e2e/          # End-to-end tests
│   │   └── package.json
│   │
│   ├── frontend/             # Next.js frontend
│   │   ├── src/
│   │   │   ├── app/          # Next.js app directory
│   │   │   ├── components/   # React components
│   │   │   ├── lib/          # Utilities
│   │   │   ├── hooks/        # Custom hooks
│   │   │   └── types/        # TypeScript types
│   │   ├── tests/
│   │   │   ├── unit/         # Unit tests
│   │   │   └── e2e/          # E2E tests
│   │   └── package.json
│   │
│   └── shared/               # Shared types/utilities
│       ├── types/            # Shared TypeScript types
│       └── constants/        # Shared constants
│
├── infrastructure/
│   ├── docker/               # Docker configurations
│   ├── k8s/                  # Kubernetes manifests
│   └── terraform/            # Infrastructure as code
│
├── scripts/                  # Build/deploy scripts
├── docs/                     # Documentation
└── .github/
    └── workflows/            # CI/CD workflows
```

### 2.2 Interface-First Development

Before implementing any component, define its interfaces:

```typescript
// packages/api/src/interfaces/repositories/IBlockRepository.ts
export interface IBlockReader {
  getBlockByNumber(number: bigint): Promise<Block | null>;
  getBlockByHash(hash: string): Promise<Block | null>;
  getLatestBlocks(limit: number): Promise<Block[]>;
}

export interface IBlockWriter {
  saveBlock(block: Block): Promise<void>;
  updateBlock(hash: string, updates: Partial<Block>): Promise<void>;
}

export interface IBlockStatistics {
  getBlockCount(): Promise<number>;
  getAverageBlockTime(): Promise<number>;
}

// Clients only implement what they need (ISP)
```

---

## 3. Phase-by-Phase Implementation

## Phase 1: Foundation & Setup (Weeks 1-3)

### Week 1: Project Setup

#### Task 1.1: Repository & Tooling Setup

**Acceptance Criteria**:
- [ ] Monorepo created with proper structure
- [ ] Linting configured (ESLint, golangci-lint)
- [ ] Formatting configured (Prettier, gofmt)
- [ ] Pre-commit hooks set up
- [ ] CI/CD pipeline configured

**TDD Approach**:
```bash
# Even setup should be testable
# Create script tests
tests/
  setup/
    test_lint_config.sh
    test_git_hooks.sh
```

**Implementation Steps**:
1. Create monorepo structure
2. Set up package managers (npm workspaces, Go modules)
3. Configure linters and formatters
4. Set up Git hooks (husky)
5. Create CI/CD workflows
6. Test all tooling works

**Deliverables**:
- Working monorepo
- All linting/formatting tools configured
- CI/CD running basic checks

---

#### Task 1.2: Database Setup (TDD)

**Test First**: Write migration tests
```sql
-- tests/migrations/test_001_blocks_table.sql
-- Test that blocks table exists with correct schema
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'blocks'
);

-- Test indexes exist
SELECT indexname FROM pg_indexes 
WHERE tablename = 'blocks';
```

**Implementation**:
```sql
-- migrations/001_create_blocks_table.sql
CREATE TABLE blocks (
    id BIGSERIAL PRIMARY KEY,
    hash VARCHAR(66) NOT NULL UNIQUE,
    number BIGINT NOT NULL,
    -- ... rest of schema
);

CREATE INDEX idx_blocks_number ON blocks(number DESC);
-- ... rest of indexes
```

**Acceptance Criteria**:
- [ ] All tables created
- [ ] All indexes created
- [ ] Foreign keys defined
- [ ] Constraints applied
- [ ] Migration tests pass
- [ ] Rollback migrations work

**Testing**:
```go
// packages/indexer/tests/integration/database_test.go
func TestDatabaseSchema(t *testing.T) {
    db := setupTestDB(t)
    defer teardownTestDB(t, db)
    
    // Test blocks table exists
    exists, err := tableExists(db, "blocks")
    assert.NoError(t, err)
    assert.True(t, exists)
    
    // Test indexes exist
    indexes, err := getTableIndexes(db, "blocks")
    assert.NoError(t, err)
    assert.Contains(t, indexes, "idx_blocks_number")
    assert.Contains(t, indexes, "idx_blocks_hash")
}
```

---

#### Task 1.3: Interface Definitions (ISP)

**Create Interface Package**:
```go
// packages/indexer/pkg/interfaces/rpc.go
package interfaces

import (
    "context"
    "math/big"
    "github.com/ethereum/go-ethereum/common"
)

// Segregated RPC interfaces

type BlockNumberReader interface {
    BlockNumber(ctx context.Context) (*big.Int, error)
}

type BlockByNumberReader interface {
    GetBlockByNumber(ctx context.Context, number *big.Int, fullTx bool) (*Block, error)
}

type BlockByHashReader interface {
    GetBlockByHash(ctx context.Context, hash common.Hash, fullTx bool) (*Block, error)
}

type ReceiptReader interface {
    GetTransactionReceipt(ctx context.Context, hash common.Hash) (*Receipt, error)
}

type LogReader interface {
    GetLogs(ctx context.Context, filter FilterQuery) ([]Log, error)
}

type CodeReader interface {
    GetCode(ctx context.Context, address common.Address) ([]byte, error)
}

// Phoenix-specific interfaces

type DAGInfoReader interface {
    GetDAGInfo(ctx context.Context) (*DAGInfo, error)
}

type BlueScoreReader interface {
    GetBlueScore(ctx context.Context, blockNumber *big.Int) (uint64, error)
}

type BlockParentsReader interface {
    GetBlockParents(ctx context.Context, hash common.Hash) ([]common.Hash, error)
}

// Composite interface for clients that need multiple capabilities
type PhoenixRPCClient interface {
    BlockNumberReader
    BlockByNumberReader
    BlockByHashReader
    ReceiptReader
    DAGInfoReader
    BlueScoreReader
    BlockParentsReader
}
```

**TypeScript Interfaces**:
```typescript
// packages/api/src/interfaces/repositories/index.ts

// Segregated repository interfaces

export interface IBlockReader {
  getBlockByNumber(number: bigint): Promise<Block | null>;
  getBlockByHash(hash: string): Promise<Block | null>;
}

export interface IBlockWriter {
  saveBlock(block: Block): Promise<void>;
}

export interface IBlockStatistics {
  getBlockCount(): Promise<number>;
  getAverageBlockTime(): Promise<number>;
}

export interface ITransactionReader {
  getTransactionByHash(hash: string): Promise<Transaction | null>;
  getTransactionsByBlockHash(blockHash: string): Promise<Transaction[]>;
}

export interface ITransactionWriter {
  saveTransaction(transaction: Transaction): Promise<void>;
}

export interface IAddressReader {
  getAddressByAddress(address: string): Promise<Address | null>;
  getAddressBalance(address: string): Promise<bigint>;
}

export interface IAddressWriter {
  saveAddress(address: Address): Promise<void>;
  updateBalance(address: string, balance: bigint): Promise<void>;
}

// DAG-specific interfaces

export interface IDAGReader {
  getBlockParents(blockHash: string): Promise<string[]>;
  getBlockChildren(blockHash: string): Promise<string[]>;
  getGHOSTDAGData(blockHash: string): Promise<GHOSTDAGData | null>;
}

export interface IDAGWriter {
  saveDAGRelationship(child: string, parent: string, isSelected: boolean): Promise<void>;
  saveGHOSTDAGData(blockHash: string, data: GHOSTDAGData): Promise<void>;
}
```

**Acceptance Criteria**:
- [ ] All interfaces defined
- [ ] Interfaces follow ISP (small, focused)
- [ ] Documentation for each interface
- [ ] Example usage provided

---

### Week 2: Core Domain Models

#### Task 2.1: Domain Models (TDD)

**Test First**: Model validation tests
```go
// packages/indexer/pkg/domain/block_test.go
package domain_test

import (
    "testing"
    "github.com/stretchr/testify/assert"
    "phoenix-explorer/packages/indexer/pkg/domain"
)

func TestBlock_Validate(t *testing.T) {
    tests := []struct {
        name    string
        block   domain.Block
        wantErr bool
    }{
        {
            name: "valid block",
            block: domain.Block{
                Hash:   "0x" + strings.Repeat("a", 64),
                Number: 100,
                Timestamp: 1706150400000,
            },
            wantErr: false,
        },
        {
            name: "invalid hash - too short",
            block: domain.Block{
                Hash:   "0xabc",
                Number: 100,
            },
            wantErr: true,
        },
        {
            name: "invalid hash - no 0x prefix",
            block: domain.Block{
                Hash:   strings.Repeat("a", 64),
                Number: 100,
            },
            wantErr: true,
        },
        {
            name: "negative block number",
            block: domain.Block{
                Hash:   "0x" + strings.Repeat("a", 64),
                Number: -1,
            },
            wantErr: true,
        },
    }
    
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            err := tt.block.Validate()
            if tt.wantErr {
                assert.Error(t, err)
            } else {
                assert.NoError(t, err)
            }
        })
    }
}
```

**Implementation**:
```go
// packages/indexer/pkg/domain/block.go
package domain

import (
    "errors"
    "regexp"
)

var hashRegex = regexp.MustCompile(`^0x[0-9a-fA-F]{64}$`)

type Block struct {
    Hash          string
    Number        int64
    ParentHashes  []string
    Timestamp     int64
    Miner         string
    GasLimit      uint64
    GasUsed       uint64
    BlueScore     uint64
    IsChainBlock  bool
    Transactions  []Transaction
}

func (b *Block) Validate() error {
    if !hashRegex.MatchString(b.Hash) {
        return errors.New("invalid block hash format")
    }
    
    if b.Number < 0 {
        return errors.New("block number cannot be negative")
    }
    
    if b.Timestamp <= 0 {
        return errors.New("timestamp must be positive")
    }
    
    // Validate parent hashes
    for _, parent := range b.ParentHashes {
        if !hashRegex.MatchString(parent) {
            return errors.New("invalid parent hash format")
        }
    }
    
    return nil
}

func (b *Block) IsGenesis() bool {
    return b.Number == 0
}

func (b *Block) ParentCount() int {
    return len(b.ParentHashes)
}
```

**Acceptance Criteria**:
- [ ] All domain models defined
- [ ] Validation logic implemented
- [ ] Test coverage > 90%
- [ ] Documentation complete

---

#### Task 2.2: Repository Interfaces (ISP)

**Test First**: Repository behavior tests
```typescript
// packages/api/tests/unit/repositories/BlockRepository.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { BlockRepository } from '@/repositories/BlockRepository';
import { createMockDatabase } from '@/tests/mocks/database';

describe('BlockRepository', () => {
  let repository: BlockRepository;
  let mockDb: MockDatabase;
  
  beforeEach(() => {
    mockDb = createMockDatabase();
    repository = new BlockRepository(mockDb);
  });
  
  describe('getBlockByNumber', () => {
    it('should return block when exists', async () => {
      const blockNumber = 100n;
      mockDb.mockQuery('SELECT * FROM blocks WHERE number = $1', [
        { hash: '0xabc...', number: '100', timestamp: '1706150400000' }
      ]);
      
      const block = await repository.getBlockByNumber(blockNumber);
      
      expect(block).toBeDefined();
      expect(block?.number).toBe(blockNumber);
    });
    
    it('should return null when block does not exist', async () => {
      const blockNumber = 999999n;
      mockDb.mockQuery('SELECT * FROM blocks WHERE number = $1', []);
      
      const block = await repository.getBlockByNumber(blockNumber);
      
      expect(block).toBeNull();
    });
    
    it('should throw error on database failure', async () => {
      const blockNumber = 100n;
      mockDb.mockQueryError('SELECT * FROM blocks WHERE number = $1', 
        new Error('Connection lost'));
      
      await expect(repository.getBlockByNumber(blockNumber))
        .rejects.toThrow('Connection lost');
    });
  });
});
```

**Implementation**:
```typescript
// packages/api/src/repositories/BlockRepository.ts
import { Pool } from 'pg';
import { 
  IBlockReader, 
  IBlockWriter, 
  IBlockStatistics 
} from '@/interfaces/repositories';
import { Block } from '@/domain/Block';

export class BlockRepository implements 
  IBlockReader, 
  IBlockWriter, 
  IBlockStatistics 
{
  constructor(private db: Pool) {}
  
  async getBlockByNumber(number: bigint): Promise<Block | null> {
    const result = await this.db.query(
      'SELECT * FROM blocks WHERE number = $1',
      [number.toString()]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToBlock(result.rows[0]);
  }
  
  async getBlockByHash(hash: string): Promise<Block | null> {
    const result = await this.db.query(
      'SELECT * FROM blocks WHERE hash = $1',
      [hash]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToBlock(result.rows[0]);
  }
  
  async saveBlock(block: Block): Promise<void> {
    await this.db.query(
      `INSERT INTO blocks (
        hash, number, parent_hashes, timestamp, 
        miner_address, gas_limit, gas_used, blue_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (hash) DO UPDATE SET
        blue_score = EXCLUDED.blue_score`,
      [
        block.hash,
        block.number.toString(),
        block.parentHashes,
        block.timestamp.toString(),
        block.miner,
        block.gasLimit.toString(),
        block.gasUsed.toString(),
        block.blueScore.toString()
      ]
    );
  }
  
  async getBlockCount(): Promise<number> {
    const result = await this.db.query(
      'SELECT COUNT(*) as count FROM blocks'
    );
    return parseInt(result.rows[0].count);
  }
  
  async getAverageBlockTime(): Promise<number> {
    const result = await this.db.query(
      `SELECT AVG(
        timestamp - LAG(timestamp) OVER (ORDER BY number)
      ) as avg_time
      FROM blocks
      WHERE number > 0`
    );
    return parseFloat(result.rows[0].avg_time || '0');
  }
  
  private mapRowToBlock(row: any): Block {
    return {
      hash: row.hash,
      number: BigInt(row.number),
      parentHashes: row.parent_hashes,
      timestamp: BigInt(row.timestamp),
      miner: row.miner_address,
      gasLimit: BigInt(row.gas_limit),
      gasUsed: BigInt(row.gas_used),
      blueScore: BigInt(row.blue_score),
      isChainBlock: row.is_chain_block,
      transactionCount: row.transaction_count
    };
  }
}
```

**Acceptance Criteria**:
- [ ] All repository interfaces implemented
- [ ] Test coverage > 80%
- [ ] Error handling complete
- [ ] Connection pooling configured

---

### Week 3: Development Environment

#### Task 3.1: Docker Development Setup

**Test First**: Environment validation tests
```bash
# tests/environment/test_docker_setup.sh
#!/bin/bash

# Test PostgreSQL is running
docker-compose ps | grep postgres | grep Up || exit 1

# Test Redis is running
docker-compose ps | grep redis | grep Up || exit 1

# Test database is accessible
docker-compose exec -T postgres psql -U postgres -c "SELECT 1" || exit 1

# Test Redis is accessible
docker-compose exec -T redis redis-cli ping | grep PONG || exit 1

echo "All environment tests passed"
```

**Implementation**:
```yaml
# docker-compose.dev.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: phoenix
      POSTGRES_PASSWORD: phoenix_dev
      POSTGRES_DB: phoenix_explorer
    ports:
      - "6660:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U phoenix"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  redis:
    image: redis:7-alpine
    ports:
      - "6661:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./infrastructure/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
  
  grafana:
    image: grafana/grafana:latest
    ports:
      - "6665:3000"  # Grafana on reserved port (6663 is frontend)
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./infrastructure/grafana/dashboards:/etc/grafana/provisioning/dashboards
    depends_on:
      - prometheus

volumes:
  postgres_data:
  redis_data:
  prometheus_data:
  grafana_data:
```

**Acceptance Criteria**:
- [ ] Docker Compose working
- [ ] All services start successfully
- [ ] Health checks passing
- [ ] Data persistence configured
- [ ] Environment tests pass

---

## Phase 2: Indexer Development (Weeks 4-7)

### Week 4: Phoenix RPC Client (TDD)

#### Task 4.1: RPC Client Interface Tests

**Test First**: Mock RPC server
```go
// packages/indexer/pkg/rpc/client_test.go
package rpc_test

import (
    "context"
    "math/big"
    "net/http"
    "net/http/httptest"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "phoenix-explorer/packages/indexer/pkg/rpc"
)

func TestPhoenixClient_BlockNumber(t *testing.T) {
    // Create mock RPC server
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":"0x3e8"}`)) // 1000 in hex
    }))
    defer server.Close()
    
    // Create client
    client := rpc.NewPhoenixClient(server.URL)
    
    // Test
    blockNumber, err := client.BlockNumber(context.Background())
    assert.NoError(t, err)
    assert.Equal(t, big.NewInt(1000), blockNumber)
}

func TestPhoenixClient_BlockNumber_RPCError(t *testing.T) {
    // Create mock RPC server that returns error
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.WriteHeader(http.StatusInternalServerError)
    }))
    defer server.Close()
    
    client := rpc.NewPhoenixClient(server.URL)
    
    _, err := client.BlockNumber(context.Background())
    assert.Error(t, err)
}

func TestPhoenixClient_GetBlockByNumber(t *testing.T) {
    mockBlock := `{
        "jsonrpc":"2.0",
        "id":1,
        "result":{
            "hash":"0xabc123",
            "number":"0x64",
            "timestamp":"0x65abc123",
            "transactions":[]
        }
    }`
    
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(mockBlock))
    }))
    defer server.Close()
    
    client := rpc.NewPhoenixClient(server.URL)
    
    block, err := client.GetBlockByNumber(context.Background(), big.NewInt(100), false)
    assert.NoError(t, err)
    assert.NotNil(t, block)
    assert.Equal(t, "0xabc123", block.Hash)
    assert.Equal(t, int64(100), block.Number)
}

func TestPhoenixClient_RetryLogic(t *testing.T) {
    attempts := 0
    server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        attempts++
        if attempts < 3 {
            w.WriteHeader(http.StatusServiceUnavailable)
            return
        }
        w.Header().Set("Content-Type", "application/json")
        w.Write([]byte(`{"jsonrpc":"2.0","id":1,"result":"0x3e8"}`))
    }))
    defer server.Close()
    
    client := rpc.NewPhoenixClient(server.URL, rpc.WithMaxRetries(3))
    
    _, err := client.BlockNumber(context.Background())
    assert.NoError(t, err)
    assert.Equal(t, 3, attempts)
}
```

**Implementation**:
```go
// packages/indexer/pkg/rpc/client.go
package rpc

import (
    "bytes"
    "context"
    "encoding/json"
    "fmt"
    "io"
    "math/big"
    "net/http"
    "time"
    
    "github.com/ethereum/go-ethereum/common"
    "phoenix-explorer/packages/indexer/pkg/interfaces"
)

type PhoenixClient struct {
    httpClient *http.Client
    rpcURL     string
    maxRetries int
    retryDelay time.Duration
}

type ClientOption func(*PhoenixClient)

func WithMaxRetries(max int) ClientOption {
    return func(c *PhoenixClient) {
        c.maxRetries = max
    }
}

func WithRetryDelay(delay time.Duration) ClientOption {
    return func(c *PhoenixClient) {
        c.retryDelay = delay
    }
}

func NewPhoenixClient(rpcURL string, opts ...ClientOption) *PhoenixClient {
    client := &PhoenixClient{
        httpClient: &http.Client{
            Timeout: 30 * time.Second,
        },
        rpcURL:     rpcURL,
        maxRetries: 3,
        retryDelay: time.Second,
    }
    
    for _, opt := range opts {
        opt(client)
    }
    
    return client
}

// Implements interfaces.BlockNumberReader
func (c *PhoenixClient) BlockNumber(ctx context.Context) (*big.Int, error) {
    var result string
    err := c.callRPC(ctx, "eth_blockNumber", []interface{}{}, &result)
    if err != nil {
        return nil, fmt.Errorf("eth_blockNumber: %w", err)
    }
    
    blockNumber := new(big.Int)
    blockNumber.SetString(result[2:], 16) // Remove "0x" prefix
    
    return blockNumber, nil
}

// Implements interfaces.BlockByNumberReader
func (c *PhoenixClient) GetBlockByNumber(
    ctx context.Context, 
    number *big.Int, 
    fullTx bool,
) (*interfaces.Block, error) {
    var result interfaces.Block
    err := c.callRPC(ctx, "eth_getBlockByNumber", 
        []interface{}{fmt.Sprintf("0x%x", number), fullTx}, &result)
    if err != nil {
        return nil, fmt.Errorf("eth_getBlockByNumber: %w", err)
    }
    
    return &result, nil
}

// Implements interfaces.BlockParentsReader
func (c *PhoenixClient) GetBlockParents(
    ctx context.Context, 
    hash common.Hash,
) ([]common.Hash, error) {
    var result []string
    err := c.callRPC(ctx, "phoenix_getBlockParents", 
        []interface{}{hash.Hex()}, &result)
    if err != nil {
        return nil, fmt.Errorf("phoenix_getBlockParents: %w", err)
    }
    
    parents := make([]common.Hash, len(result))
    for i, p := range result {
        parents[i] = common.HexToHash(p)
    }
    
    return parents, nil
}

func (c *PhoenixClient) callRPC(
    ctx context.Context, 
    method string, 
    params []interface{}, 
    result interface{},
) error {
    request := map[string]interface{}{
        "jsonrpc": "2.0",
        "method":  method,
        "params":  params,
        "id":      1,
    }
    
    reqBody, err := json.Marshal(request)
    if err != nil {
        return fmt.Errorf("marshal request: %w", err)
    }
    
    var lastErr error
    for attempt := 0; attempt <= c.maxRetries; attempt++ {
        if attempt > 0 {
            select {
            case <-ctx.Done():
                return ctx.Err()
            case <-time.After(c.retryDelay * time.Duration(attempt)):
            }
        }
        
        req, err := http.NewRequestWithContext(ctx, "POST", c.rpcURL, 
            bytes.NewReader(reqBody))
        if err != nil {
            return fmt.Errorf("create request: %w", err)
        }
        
        req.Header.Set("Content-Type", "application/json")
        
        resp, err := c.httpClient.Do(req)
        if err != nil {
            lastErr = err
            continue
        }
        
        body, err := io.ReadAll(resp.Body)
        resp.Body.Close()
        
        if err != nil {
            lastErr = err
            continue
        }
        
        if resp.StatusCode != http.StatusOK {
            lastErr = fmt.Errorf("RPC error: status %d", resp.StatusCode)
            continue
        }
        
        var rpcResp struct {
            Result json.RawMessage `json:"result"`
            Error  *struct {
                Code    int    `json:"code"`
                Message string `json:"message"`
            } `json:"error"`
        }
        
        if err := json.Unmarshal(body, &rpcResp); err != nil {
            return fmt.Errorf("unmarshal response: %w", err)
        }
        
        if rpcResp.Error != nil {
            return fmt.Errorf("RPC error %d: %s", 
                rpcResp.Error.Code, rpcResp.Error.Message)
        }
        
        if err := json.Unmarshal(rpcResp.Result, result); err != nil {
            return fmt.Errorf("unmarshal result: %w", err)
        }
        
        return nil
    }
    
    return fmt.Errorf("max retries exceeded: %w", lastErr)
}
```

**Acceptance Criteria**:
- [ ] All RPC methods implemented
- [ ] Retry logic working
- [ ] Error handling complete
- [ ] Test coverage > 90%
- [ ] Mock server tests pass

---

*This is Part 1 of the implementation plan. Due to length, I'll continue in the next section...*

Would you like me to continue with the remaining weeks (5-24) of the detailed implementation plan? This will include:
- Week 5-7: Block/Transaction/DAG indexers with full TDD
- Week 8-10: API layer with ISP-segregated interfaces
- Week 11-15: Frontend with component testing
- Week 16-18: EVM features with integration tests
- Week 19-20: DAG visualization with E2E tests
- Week 21-23: Testing, optimization, security
- Week 24: Deployment

Each week will have:
- Detailed TDD approach (test first, then implement)
- ISP-compliant interface definitions
- Acceptance criteria
- Code examples
- Testing strategies

Shall I continue?

