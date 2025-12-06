package indexer

import (
	"context"
	"fmt"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

// TransactionIndexerDeps contains dependencies for TransactionIndexer (ISP)
type TransactionIndexerDeps struct {
	RPC    interfaces.ReceiptReader
	TxDB   interfaces.TransactionWriter
	LogDB  interfaces.LogWriter
	Logger *zap.Logger
}

// TransactionIndexer indexes transaction receipts and logs
type TransactionIndexer struct {
	rpc    interfaces.ReceiptReader
	txDB   interfaces.TransactionWriter
	logDB  interfaces.LogWriter
	logger *zap.Logger
}

// NewTransactionIndexer creates a new TransactionIndexer
func NewTransactionIndexer(deps TransactionIndexerDeps) *TransactionIndexer {
	logger := deps.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &TransactionIndexer{
		rpc:    deps.RPC,
		txDB:   deps.TxDB,
		logDB:  deps.LogDB,
		logger: logger,
	}
}

// IndexTransactionReceipt indexes a transaction receipt and its logs
func (ti *TransactionIndexer) IndexTransactionReceipt(
	ctx context.Context,
	txHash common.Hash,
) error {
	// 1. Fetch receipt from RPC
	receipt, err := ti.rpc.GetTransactionReceipt(ctx, txHash)
	if err != nil {
		ti.logger.Error("failed to fetch receipt",
			zap.String("txHash", txHash.Hex()),
			zap.Error(err))
		return fmt.Errorf("fetch receipt: %w", err)
	}

	if receipt == nil {
		ti.logger.Debug("receipt not found",
			zap.String("txHash", txHash.Hex()))
		return nil // Not an error, just not found
	}

	// 2. Update transaction status
	if err := ti.txDB.UpdateTransactionStatus(
		ctx,
		txHash.Hex(),
		receipt.Status,
		receipt.GasUsed,
	); err != nil {
		return fmt.Errorf("update transaction status: %w", err)
	}

	// 3. Save logs (even for failed transactions, logs might exist)
	for i, rpcLog := range receipt.Logs {
		log := ti.convertRPCLogToDomain(rpcLog, txHash.Hex(), uint64(i))
		if err := ti.logDB.SaveLog(ctx, log); err != nil {
			ti.logger.Warn("failed to save log",
				zap.String("txHash", txHash.Hex()),
				zap.Int("logIndex", i),
				zap.Error(err))
			// Continue processing other logs
		}
	}

	ti.logger.Debug("transaction receipt indexed",
		zap.String("txHash", txHash.Hex()),
		zap.Int("status", receipt.Status),
		zap.Int("logCount", len(receipt.Logs)))

	return nil
}

// convertRPCLogToDomain converts interfaces.Log to domain.Log
func (ti *TransactionIndexer) convertRPCLogToDomain(
	rpcLog interfaces.Log,
	txHash string,
	logIndex uint64,
) *domain.Log {
	return &domain.Log{
		TransactionHash: txHash,
		LogIndex:        logIndex,
		Address:         rpcLog.Address,
		Topics:          rpcLog.Topics,
		Data:            rpcLog.Data,
	}
}

