package indexer

import (
	"context"
	"fmt"
	"math/big"
	"sync"

	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

// BlockIndexerDeps contains dependencies for BlockIndexer (ISP: only what's needed)
type BlockIndexerDeps struct {
	RPC    interfaces.BlockByNumberReader
	DB     interfaces.BlockWriter
	TxDB   interfaces.TransactionWriter
	Logger *zap.Logger
}

// BlockIndexer indexes blocks from Phoenix Node
type BlockIndexer struct {
	rpc    interfaces.BlockByNumberReader
	db     interfaces.BlockWriter
	txDB   interfaces.TransactionWriter
	logger *zap.Logger
}

// NewBlockIndexer creates a new BlockIndexer
func NewBlockIndexer(deps BlockIndexerDeps) *BlockIndexer {
	logger := deps.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &BlockIndexer{
		rpc:    deps.RPC,
		db:     deps.DB,
		txDB:   deps.TxDB,
		logger: logger,
	}
}

// IndexBlock indexes a single block
func (bi *BlockIndexer) IndexBlock(ctx context.Context, blockNum *big.Int) error {
	// 1. Fetch block from RPC
	rpcBlock, err := bi.rpc.GetBlockByNumber(ctx, blockNum, true)
	if err != nil {
		bi.logger.Error("failed to fetch block",
			zap.String("blockNumber", blockNum.String()),
			zap.Error(err))
		return fmt.Errorf("fetch block %s: %w", blockNum, err)
	}

	if rpcBlock == nil {
		return fmt.Errorf("block %s not found", blockNum)
	}

	// 2. Convert RPC block to domain block
	block := bi.convertRPCBlockToDomain(rpcBlock)

	// 3. Validate block
	if err := block.Validate(); err != nil {
		return fmt.Errorf("invalid block: %w", err)
	}

	// 4. Save block
	if err := bi.db.SaveBlock(ctx, block); err != nil {
		return fmt.Errorf("save block: %w", err)
	}

	// 5. Save transactions
	for _, rpcTx := range rpcBlock.Transactions {
		tx := bi.convertRPCTransactionToDomain(rpcTx, block.Hash, block.Number)
		if err := bi.txDB.SaveTransaction(ctx, tx); err != nil {
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

// IndexBlockRange indexes a range of blocks
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

// convertRPCBlockToDomain converts interfaces.Block to domain.Block
func (bi *BlockIndexer) convertRPCBlockToDomain(rpcBlock *interfaces.Block) *domain.Block {
	transactions := make([]domain.Transaction, 0, len(rpcBlock.Transactions))
	for _, rpcTx := range rpcBlock.Transactions {
		tx := bi.convertRPCTransactionToDomain(rpcTx, rpcBlock.Hash, rpcBlock.Number)
		transactions = append(transactions, *tx)
	}

	return &domain.Block{
		Hash:           rpcBlock.Hash,
		Number:         rpcBlock.Number,
		ParentHashes:   rpcBlock.ParentHashes,
		Timestamp:      rpcBlock.Timestamp,
		Miner:          rpcBlock.Miner,
		GasLimit:       rpcBlock.GasLimit,
		GasUsed:        rpcBlock.GasUsed,
		BaseFeePerGas:  rpcBlock.BaseFeePerGas,
		BlueScore:      rpcBlock.BlueScore,
		IsChainBlock:   rpcBlock.IsChainBlock,
		SelectedParent: rpcBlock.SelectedParent,
		Transactions:   transactions,
	}
}

// convertRPCTransactionToDomain converts interfaces.Transaction to domain.Transaction
func (bi *BlockIndexer) convertRPCTransactionToDomain(
	rpcTx interfaces.Transaction,
	blockHash string,
	blockNumber int64,
) *domain.Transaction {
	var value uint64
	if rpcTx.Value != nil {
		value = rpcTx.Value.Uint64()
	}

	var gasPrice *uint64
	if rpcTx.GasPrice != nil {
		gp := rpcTx.GasPrice.Uint64()
		gasPrice = &gp
	}

	return &domain.Transaction{
		Hash:             rpcTx.Hash,
		BlockHash:        blockHash,
		BlockNumber:      blockNumber,
		TransactionIndex: 0, // Will be set by database
		From:             rpcTx.From,
		To:               rpcTx.To,
		Value:            value,
		GasLimit:         rpcTx.Gas,
		GasPrice:         gasPrice,
		Nonce:            rpcTx.Nonce,
		Input:            rpcTx.Input,
		CreatesContract: rpcTx.To == nil,
	}
}

