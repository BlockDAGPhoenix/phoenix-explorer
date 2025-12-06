# Phoenix Explorer - Implementation Plan (Part 2)

**Continued from IMPLEMENTATION_PLAN.md**

---

## Phase 2: Indexer Development (Continued)

### Week 5-6: Block & Transaction Indexers (TDD)

#### Task 5.1: Block Indexer with TDD

**Test First**: Block indexer behavior tests
```go
// packages/indexer/pkg/indexer/block_indexer_test.go
package indexer_test

import (
    "context"
    "math/big"
    "testing"
    
    "github.com/stretchr/testify/assert"
    "github.com/stretchr/testify/mock"
    "phoenix-explorer/packages/indexer/pkg/indexer"
    "phoenix-explorer/packages/indexer/pkg/interfaces"
    "phoenix-explorer/packages/indexer/tests/mocks"
)

func TestBlockIndexer_IndexBlock(t *testing.T) {
    // Setup mocks
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDatabase)
    
    ctx := context.Background()
    blockNum := big.NewInt(100)
    
    // Expected block from RPC
    expectedBlock := &interfaces.Block{
        Hash:   "0xabc123",
        Number: 100,
        ParentHashes: []string{"0xparent1"},
        Timestamp: 1706150400000,
        Transactions: []interfaces.Transaction{
            {Hash: "0xtx1", From: "0xfrom", To: "0xto"},
        },
    }
    
    // Setup expectations (TDD: define behavior first)
    mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
        Return(expectedBlock, nil)
    
    mockDB.On("SaveBlock", expectedBlock).
        Return(nil)
    
    mockDB.On("SaveTransaction", mock.Anything).
        Return(nil)
    
    // Create indexer
    idx := indexer.NewBlockIndexer(mockRPC, mockDB)
    
    // Execute
    err := idx.IndexBlock(ctx, blockNum)
    
    // Assert
    assert.NoError(t, err)
    mockRPC.AssertExpectations(t)
    mockDB.AssertExpectations(t)
}

func TestBlockIndexer_IndexBlock_RPCFailure(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDatabase)
    
    ctx := context.Background()
    blockNum := big.NewInt(100)
    
    // RPC returns error
    mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
        Return(nil, errors.New("connection failed"))
    
    idx := indexer.NewBlockIndexer(mockRPC, mockDB)
    
    err := idx.IndexBlock(ctx, blockNum)
    
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "connection failed")
}

func TestBlockIndexer_IndexBlock_DatabaseFailure(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDatabase)
    
    ctx := context.Background()
    blockNum := big.NewInt(100)
    
    expectedBlock := &interfaces.Block{
        Hash:   "0xabc123",
        Number: 100,
    }
    
    mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
        Return(expectedBlock, nil)
    
    // Database save fails
    mockDB.On("SaveBlock", expectedBlock).
        Return(errors.New("database full"))
    
    idx := indexer.NewBlockIndexer(mockRPC, mockDB)
    
    err := idx.IndexBlock(ctx, blockNum)
    
    assert.Error(t, err)
    assert.Contains(t, err.Error(), "database full")
}

func TestBlockIndexer_IndexBlockRange(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDatabase)
    
    ctx := context.Background()
    fromBlock := big.NewInt(100)
    toBlock := big.NewInt(102)
    
    // Setup expectations for 3 blocks
    for i := int64(100); i <= 102; i++ {
        block := &interfaces.Block{
            Hash:   fmt.Sprintf("0x%d", i),
            Number: i,
        }
        mockRPC.On("GetBlockByNumber", ctx, big.NewInt(i), true).
            Return(block, nil)
        mockDB.On("SaveBlock", block).Return(nil)
    }
    
    idx := indexer.NewBlockIndexer(mockRPC, mockDB)
    
    err := idx.IndexBlockRange(ctx, fromBlock, toBlock)
    
    assert.NoError(t, err)
    mockRPC.AssertExpectations(t)
    mockDB.AssertExpectations(t)
}
```

**Implementation**:
```go
// packages/indexer/pkg/indexer/block_indexer.go
package indexer

import (
    "context"
    "fmt"
    "math/big"
    "sync"
    
    "go.uber.org/zap"
    "phoenix-explorer/packages/indexer/pkg/interfaces"
)

// ISP: Segregated interfaces for what we actually need
type BlockIndexerDeps struct {
    RPC interfaces.BlockByNumberReader
    DB  interfaces.BlockWriter
    TxDB interfaces.TransactionWriter
    Logger *zap.Logger
}

type BlockIndexer struct {
    rpc    interfaces.BlockByNumberReader
    db     interfaces.BlockWriter
    txDB   interfaces.TransactionWriter
    logger *zap.Logger
}

func NewBlockIndexer(deps BlockIndexerDeps) *BlockIndexer {
    return &BlockIndexer{
        rpc:    deps.RPC,
        db:     deps.DB,
        txDB:   deps.TxDB,
        logger: deps.Logger,
    }
}

func (bi *BlockIndexer) IndexBlock(ctx context.Context, blockNum *big.Int) error {
    // 1. Fetch block from RPC
    block, err := bi.rpc.GetBlockByNumber(ctx, blockNum, true)
    if err != nil {
        bi.logger.Error("failed to fetch block",
            zap.String("blockNumber", blockNum.String()),
            zap.Error(err))
        return fmt.Errorf("fetch block %s: %w", blockNum, err)
    }
    
    // 2. Validate block
    if err := block.Validate(); err != nil {
        return fmt.Errorf("invalid block: %w", err)
    }
    
    // 3. Save block
    if err := bi.db.SaveBlock(block); err != nil {
        return fmt.Errorf("save block: %w", err)
    }
    
    // 4. Save transactions
    for _, tx := range block.Transactions {
        if err := bi.txDB.SaveTransaction(&tx); err != nil {
            bi.logger.Warn("failed to save transaction",
                zap.String("txHash", tx.Hash),
                zap.Error(err))
            // Continue processing other transactions
        }
    }
    
    bi.logger.Info("block indexed",
        zap.Int64("number", block.Number),
        zap.String("hash", block.Hash),
        zap.Int("txCount", len(block.Transactions)))
    
    return nil
}

func (bi *BlockIndexer) IndexBlockRange(ctx context.Context, from, to *big.Int) error {
    blockCount := new(big.Int).Sub(to, from).Int64() + 1
    
    // Create worker pool
    workerCount := 10
    blockChan := make(chan *big.Int, blockCount)
    errChan := make(chan error, blockCount)
    
    var wg sync.WaitGroup
    
    // Start workers
    for i := 0; i < workerCount; i++ {
        wg.Add(1)
        go func() {
            defer wg.Done()
            for blockNum := range blockChan {
                if err := bi.IndexBlock(ctx, blockNum); err != nil {
                    errChan <- err
                }
            }
        }()
    }
    
    // Send work
    current := new(big.Int).Set(from)
    for current.Cmp(to) <= 0 {
        blockChan <- new(big.Int).Set(current)
        current.Add(current, big.NewInt(1))
    }
    close(blockChan)
    
    // Wait for completion
    wg.Wait()
    close(errChan)
    
    // Check for errors
    var errors []error
    for err := range errChan {
        errors = append(errors, err)
    }
    
    if len(errors) > 0 {
        return fmt.Errorf("indexed %d blocks with %d errors: %v", 
            blockCount, len(errors), errors[0])
    }
    
    bi.logger.Info("block range indexed",
        zap.String("from", from.String()),
        zap.String("to", to.String()))
    
    return nil
}
```

#### Task 5.2: Transaction Indexer with Receipt Fetching

**Test First**:
```go
// packages/indexer/pkg/indexer/transaction_indexer_test.go
func TestTransactionIndexer_IndexTransaction(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDatabase)
    
    ctx := context.Background()
    txHash := common.HexToHash("0xtx1")
    
    expectedReceipt := &interfaces.Receipt{
        TransactionHash: txHash.Hex(),
        Status: 1,
        GasUsed: 21000,
        Logs: []interfaces.Log{
            {Address: "0xcontract", Topics: []string{"0xtopic1"}},
        },
    }
    
    mockRPC.On("GetTransactionReceipt", ctx, txHash).
        Return(expectedReceipt, nil)
    
    mockDB.On("UpdateTransactionStatus", txHash.Hex(), 1, uint64(21000)).
        Return(nil)
    
    mockDB.On("SaveLog", mock.Anything).
        Return(nil)
    
    idx := indexer.NewTransactionIndexer(mockRPC, mockDB)
    
    err := idx.IndexTransactionReceipt(ctx, txHash)
    
    assert.NoError(t, err)
    mockRPC.AssertExpectations(t)
    mockDB.AssertExpectations(t)
}
```

**Implementation**:
```go
// packages/indexer/pkg/indexer/transaction_indexer.go
type TransactionIndexer struct {
    rpc    interfaces.ReceiptReader
    db     interfaces.TransactionWriter
    logDB  interfaces.LogWriter
    logger *zap.Logger
}

func (ti *TransactionIndexer) IndexTransactionReceipt(
    ctx context.Context, 
    txHash common.Hash,
) error {
    receipt, err := ti.rpc.GetTransactionReceipt(ctx, txHash)
    if err != nil {
        return fmt.Errorf("fetch receipt: %w", err)
    }
    
    // Update transaction status
    if err := ti.db.UpdateTransactionStatus(
        txHash.Hex(), 
        receipt.Status, 
        receipt.GasUsed,
    ); err != nil {
        return fmt.Errorf("update transaction: %w", err)
    }
    
    // Save logs
    for _, log := range receipt.Logs {
        if err := ti.logDB.SaveLog(&log); err != nil {
            ti.logger.Warn("failed to save log", zap.Error(err))
        }
    }
    
    return nil
}
```

**Acceptance Criteria**:
- [ ] Block indexer fully tested
- [ ] Transaction indexer fully tested
- [ ] Receipt fetching working
- [ ] Error handling robust
- [ ] Test coverage > 85%
- [ ] Parallel processing working

---

### Week 7: DAG Indexer & Token Detection (TDD)

#### Task 7.1: DAG Relationship Indexer

**Test First**:
```go
// packages/indexer/pkg/indexer/dag_indexer_test.go
func TestDAGIndexer_IndexDAGRelationships(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDAGWriter)
    
    ctx := context.Background()
    blockHash := common.HexToHash("0xblock1")
    
    parentHashes := []common.Hash{
        common.HexToHash("0xparent1"),
        common.HexToHash("0xparent2"),
    }
    
    mockRPC.On("GetBlockParents", ctx, blockHash).
        Return(parentHashes, nil)
    
    // Expect relationships to be saved
    mockDB.On("SaveDAGRelationship", 
        blockHash.Hex(), parentHashes[0].Hex(), true).
        Return(nil) // First parent is selected
    
    mockDB.On("SaveDAGRelationship", 
        blockHash.Hex(), parentHashes[1].Hex(), false).
        Return(nil)
    
    idx := indexer.NewDAGIndexer(mockRPC, mockDB)
    
    err := idx.IndexDAGRelationships(ctx, blockHash)
    
    assert.NoError(t, err)
    mockRPC.AssertExpectations(t)
    mockDB.AssertExpectations(t)
}

func TestDAGIndexer_IndexGHOSTDAGData(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockDAGWriter)
    
    ctx := context.Background()
    blockHash := common.HexToHash("0xblock1")
    
    dagInfo := &interfaces.GHOSTDAGData{
        BlueScore: 100,
        BlueWork:  big.NewInt(1000000),
        MergeSetBlues: []string{"0xblue1", "0xblue2"},
        MergeSetReds:  []string{"0xred1"},
    }
    
    mockRPC.On("GetGHOSTDAGData", ctx, blockHash).
        Return(dagInfo, nil)
    
    mockDB.On("SaveGHOSTDAGData", blockHash.Hex(), dagInfo).
        Return(nil)
    
    idx := indexer.NewDAGIndexer(mockRPC, mockDB)
    
    err := idx.IndexGHOSTDAGData(ctx, blockHash)
    
    assert.NoError(t, err)
    mockDB.AssertCalled(t, "SaveGHOSTDAGData", blockHash.Hex(), dagInfo)
}
```

**Implementation**:
```go
// packages/indexer/pkg/indexer/dag_indexer.go
type DAGIndexer struct {
    rpc    interfaces.BlockParentsReader
    dagRPC interfaces.DAGInfoReader
    db     interfaces.DAGWriter
    logger *zap.Logger
}

func (di *DAGIndexer) IndexDAGRelationships(
    ctx context.Context,
    blockHash common.Hash,
) error {
    parents, err := di.rpc.GetBlockParents(ctx, blockHash)
    if err != nil {
        return fmt.Errorf("get block parents: %w", err)
    }
    
    for i, parentHash := range parents {
        isSelectedParent := i == 0 // First parent is selected
        
        err = di.db.SaveDAGRelationship(
            blockHash.Hex(),
            parentHash.Hex(),
            isSelectedParent,
        )
        if err != nil {
            return fmt.Errorf("save DAG relationship: %w", err)
        }
    }
    
    di.logger.Debug("DAG relationships indexed",
        zap.String("block", blockHash.Hex()),
        zap.Int("parentCount", len(parents)))
    
    return nil
}

func (di *DAGIndexer) IndexGHOSTDAGData(
    ctx context.Context,
    blockHash common.Hash,
) error {
    dagInfo, err := di.dagRPC.GetGHOSTDAGData(ctx, blockHash)
    if err != nil {
        return fmt.Errorf("get GHOSTDAG data: %w", err)
    }
    
    if err := di.db.SaveGHOSTDAGData(blockHash.Hex(), dagInfo); err != nil {
        return fmt.Errorf("save GHOSTDAG data: %w", err)
    }
    
    return nil
}
```

#### Task 7.2: Token Detection (TDD)

**Test First**:
```go
// packages/indexer/pkg/indexer/token_detector_test.go
func TestTokenDetector_DetectERC20(t *testing.T) {
    mockRPC := new(mocks.MockPhoenixClient)
    mockDB := new(mocks.MockTokenWriter)
    
    ctx := context.Context()
    contractAddr := common.HexToAddress("0xtoken1")
    
    // Mock contract code check
    mockRPC.On("GetCode", ctx, contractAddr).
        Return([]byte{0x60, 0x80}, nil) // Has code
    
    // Mock ERC-20 function calls
    mockRPC.On("Call", ctx, mock.MatchedBy(func(call interfaces.CallMsg) bool {
        return call.To.Hex() == contractAddr.Hex() && 
               string(call.Data[:4]) == "name()"
    })).Return([]byte("MyToken"), nil)
    
    mockRPC.On("Call", ctx, mock.MatchedBy(func(call interfaces.CallMsg) bool {
        return string(call.Data[:4]) == "symbol()"
    })).Return([]byte("MTK"), nil)
    
    mockRPC.On("Call", ctx, mock.MatchedBy(func(call interfaces.CallMsg) bool {
        return string(call.Data[:4]) == "decimals()"
    })).Return([]byte{18}, nil)
    
    mockDB.On("SaveToken", mock.MatchedBy(func(token *interfaces.Token) bool {
        return token.Address == contractAddr.Hex() &&
               token.TokenType == "ERC20" &&
               token.Name == "MyToken" &&
               token.Symbol == "MTK" &&
               token.Decimals == 18
    })).Return(nil)
    
    detector := indexer.NewTokenDetector(mockRPC, mockDB)
    
    err := detector.DetectAndIndexToken(ctx, contractAddr)
    
    assert.NoError(t, err)
    mockDB.AssertExpectations(t)
}
```

**Acceptance Criteria**:
- [ ] DAG indexer fully tested
- [ ] Token detector fully tested
- [ ] ERC-20 detection working
- [ ] ERC-721 detection working
- [ ] ERC-1155 detection working
- [ ] Test coverage > 85%

---

## Phase 3: API Layer (Weeks 8-10)

### Week 8: API Foundation (TDD + ISP)

#### Task 8.1: Service Layer with ISP

**Define Interfaces First**:
```typescript
// packages/api/src/interfaces/services/IBlockService.ts
export interface IBlockService {
  getBlockByNumber(number: bigint): Promise<Block | null>;
  getBlockByHash(hash: string): Promise<Block | null>;
  getLatestBlocks(limit: number): Promise<Block[]>;
}

export interface IBlockStatisticsService {
  getBlockCount(): Promise<number>;
  getAverageBlockTime(): Promise<number>;
  getBlocksPerDay(): Promise<number>;
}

export interface IBlockDAGService {
  getBlockParents(blockHash: string): Promise<string[]>;
  getBlockChildren(blockHash: string): Promise<string[]>;
  getDAGVisualizationData(blockHash: string, depth: number): Promise<DAGGraph>;
}

// Separate interfaces for different concerns (ISP)
```

**Test First**:
```typescript
// packages/api/tests/unit/services/BlockService.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockService } from '@/services/BlockService';
import { createMockBlockRepository } from '@/tests/mocks/repositories';
import { Block } from '@/domain/Block';

describe('BlockService', () => {
  let service: BlockService;
  let mockRepository: ReturnType<typeof createMockBlockRepository>;
  
  beforeEach(() => {
    mockRepository = createMockBlockRepository();
    service = new BlockService(mockRepository);
  });
  
  describe('getBlockByNumber', () => {
    it('should return block when exists', async () => {
      const blockNumber = 100n;
      const expectedBlock = new Block({
        hash: '0xabc123',
        number: blockNumber,
        timestamp: 1706150400000n,
      });
      
      mockRepository.getBlockByNumber.mockResolvedValue(expectedBlock);
      
      const result = await service.getBlockByNumber(blockNumber);
      
      expect(result).toEqual(expectedBlock);
      expect(mockRepository.getBlockByNumber).toHaveBeenCalledWith(blockNumber);
    });
    
    it('should return null when block does not exist', async () => {
      const blockNumber = 999999n;
      
      mockRepository.getBlockByNumber.mockResolvedValue(null);
      
      const result = await service.getBlockByNumber(blockNumber);
      
      expect(result).toBeNull();
    });
    
    it('should throw error when repository fails', async () => {
      const blockNumber = 100n;
      
      mockRepository.getBlockByNumber.mockRejectedValue(
        new Error('Database connection lost')
      );
      
      await expect(service.getBlockByNumber(blockNumber))
        .rejects.toThrow('Database connection lost');
    });
  });
  
  describe('getLatestBlocks', () => {
    it('should validate limit parameter', async () => {
      await expect(service.getLatestBlocks(-1))
        .rejects.toThrow('Limit must be positive');
      
      await expect(service.getLatestBlocks(101))
        .rejects.toThrow('Limit cannot exceed 100');
    });
    
    it('should return blocks in descending order', async () => {
      const blocks = [
        new Block({ hash: '0x1', number: 102n }),
        new Block({ hash: '0x2', number: 101n }),
        new Block({ hash: '0x3', number: 100n }),
      ];
      
      mockRepository.getLatestBlocks.mockResolvedValue(blocks);
      
      const result = await service.getLatestBlocks(3);
      
      expect(result).toHaveLength(3);
      expect(result[0].number).toBeGreaterThan(result[1].number);
      expect(result[1].number).toBeGreaterThan(result[2].number);
    });
  });
});
```

**Implementation**:
```typescript
// packages/api/src/services/BlockService.ts
import { IBlockService } from '@/interfaces/services/IBlockService';
import { IBlockReader } from '@/interfaces/repositories/IBlockRepository';
import { Block } from '@/domain/Block';
import { ValidationError } from '@/errors';

export class BlockService implements IBlockService {
  constructor(
    private readonly blockRepository: IBlockReader
  ) {}
  
  async getBlockByNumber(number: bigint): Promise<Block | null> {
    if (number < 0n) {
      throw new ValidationError('Block number cannot be negative');
    }
    
    return await this.blockRepository.getBlockByNumber(number);
  }
  
  async getBlockByHash(hash: string): Promise<Block | null> {
    if (!this.isValidHash(hash)) {
      throw new ValidationError('Invalid block hash format');
    }
    
    return await this.blockRepository.getBlockByHash(hash);
  }
  
  async getLatestBlocks(limit: number): Promise<Block[]> {
    if (limit <= 0) {
      throw new ValidationError('Limit must be positive');
    }
    
    if (limit > 100) {
      throw new ValidationError('Limit cannot exceed 100');
    }
    
    return await this.blockRepository.getLatestBlocks(limit);
  }
  
  private isValidHash(hash: string): boolean {
    return /^0x[0-9a-fA-F]{64}$/.test(hash);
  }
}
```

#### Task 8.2: Controller Layer with Validation

**Test First**:
```typescript
// packages/api/tests/integration/controllers/BlockController.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestApp } from '@/tests/helpers/app';
import { seedTestData } from '@/tests/helpers/seed';

describe('BlockController', () => {
  let app: Express;
  let cleanup: () => Promise<void>;
  
  beforeAll(async () => {
    ({ app, cleanup } = await createTestApp());
    await seedTestData();
  });
  
  afterAll(async () => {
    await cleanup();
  });
  
  describe('GET /api/v1/blocks/latest', () => {
    it('should return latest blocks', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/latest?limit=5')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.blocks).toHaveLength(5);
      expect(response.body.data.blocks[0].number)
        .toBeGreaterThan(response.body.data.blocks[1].number);
    });
    
    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/latest?limit=101')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
    
    it('should use default limit when not specified', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/latest')
        .expect(200);
      
      expect(response.body.data.blocks).toHaveLength(20); // Default limit
    });
  });
  
  describe('GET /api/v1/blocks/:blockNumber', () => {
    it('should return block by number', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/100')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.data.number).toBe('100');
    });
    
    it('should return 404 when block does not exist', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/999999')
        .expect(404);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
    
    it('should validate block number format', async () => {
      const response = await request(app)
        .get('/api/v1/blocks/invalid')
        .expect(400);
      
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
  });
  
  describe('Rate Limiting', () => {
    it('should enforce rate limits', async () => {
      const requests = Array(101).fill(null).map(() =>
        request(app).get('/api/v1/blocks/latest')
      );
      
      const responses = await Promise.all(requests);
      const tooManyRequests = responses.filter(r => r.status === 429);
      
      expect(tooManyRequests.length).toBeGreaterThan(0);
    });
  });
});
```

**Implementation**:
```typescript
// packages/api/src/controllers/BlockController.ts
import { Request, Response, NextFunction } from 'express';
import { IBlockService } from '@/interfaces/services/IBlockService';
import { ValidationError, NotFoundError } from '@/errors';
import { validate } from '@/middleware/validation';
import { z } from 'zod';

// Validation schemas
const getLatestBlocksSchema = z.object({
  limit: z.coerce.number().int().positive().max(100).default(20),
});

const getBlockByNumberSchema = z.object({
  blockNumber: z.coerce.bigint().nonnegative(),
});

export class BlockController {
  constructor(
    private readonly blockService: IBlockService
  ) {}
  
  getLatestBlocks = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { limit } = getLatestBlocksSchema.parse(req.query);
      
      const blocks = await this.blockService.getLatestBlocks(limit);
      
      res.json({
        success: true,
        data: {
          blocks: blocks.map(b => b.toJSON()),
        },
      });
    } catch (error) {
      next(error);
    }
  };
  
  getBlockByNumber = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { blockNumber } = getBlockByNumberSchema.parse(req.params);
      
      const block = await this.blockService.getBlockByNumber(blockNumber);
      
      if (!block) {
        throw new NotFoundError(`Block ${blockNumber} not found`);
      }
      
      res.json({
        success: true,
        data: block.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };
  
  getBlockByHash = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { hash } = req.params;
      
      if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) {
        throw new ValidationError('Invalid block hash format');
      }
      
      const block = await this.blockService.getBlockByHash(hash);
      
      if (!block) {
        throw new NotFoundError(`Block ${hash} not found`);
      }
      
      res.json({
        success: true,
        data: block.toJSON(),
      });
    } catch (error) {
      next(error);
    }
  };
}
```

**Acceptance Criteria**:
- [ ] All service interfaces defined (ISP)
- [ ] Service layer fully tested
- [ ] Controller layer fully tested
- [ ] Validation working
- [ ] Error handling complete
- [ ] Test coverage > 85%

---

*Continue with Weeks 9-24 in next message?*

This implementation plan includes:
- Detailed TDD approach for every component
- ISP-compliant interface segregation
- Comprehensive test examples
- Acceptance criteria for each task
- Code examples showing proper patterns

Shall I continue with the remaining weeks (9-24)?

