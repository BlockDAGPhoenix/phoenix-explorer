package database_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestLogRepository_SaveLog(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup block and transaction
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	block := &domain.Block{
		Hash:         "0x" + strings.Repeat("a", 64),
		Number:      100,
		ParentHashes: []string{},
		Timestamp:   time.Now().Unix(),
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1000,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	err := blockRepo.SaveBlock(ctx, block)
	require.NoError(t, err)

	txRepo := database.NewTransactionRepository(conn, zap.NewNop())
	tx := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("b", 64),
		BlockHash:        block.Hash,
		BlockNumber:      block.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("c", 40),
		To:               stringPtr("0x" + strings.Repeat("d", 40)),
		Value:            1000000000000000000,
		GasLimit:         21000,
		Nonce:            5,
		Input:            []byte{},
		Status:           intPtr(1),
		CreatesContract:  false,
	}
	err = txRepo.SaveTransaction(ctx, tx)
	require.NoError(t, err)

	// Save log
	repo := database.NewLogRepository(conn, zap.NewNop())
	log := &domain.Log{
		TransactionHash: tx.Hash,
		LogIndex:        0,
		Address:         "0x" + strings.Repeat("e", 40),
		Topics:          []string{"0x" + strings.Repeat("f", 64)},
		Data:            []byte{0x01, 0x02, 0x03},
		BlockNumber:     block.Number,
		BlockHash:       block.Hash,
	}

	err = repo.SaveLog(ctx, log)
	require.NoError(t, err)

	// Verify log was saved
	logs, err := repo.GetLogsByTransactionHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.Len(t, logs, 1)
	assert.Equal(t, log.Address, logs[0].Address)
}

func TestLogRepository_GetLogsByTransactionHash(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	block := &domain.Block{
		Hash:         "0x" + strings.Repeat("a", 64),
		Number:      100,
		ParentHashes: []string{},
		Timestamp:   time.Now().Unix(),
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1000,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, block)

	txRepo := database.NewTransactionRepository(conn, zap.NewNop())
	tx := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("b", 64),
		BlockHash:        block.Hash,
		BlockNumber:      block.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("c", 40),
		To:               stringPtr("0x" + strings.Repeat("d", 40)),
		Value:            1000000000000000000,
		GasLimit:         21000,
		Nonce:            5,
		Input:            []byte{},
		Status:           intPtr(1),
		CreatesContract:  false,
	}
	txRepo.SaveTransaction(ctx, tx)

	repo := database.NewLogRepository(conn, zap.NewNop())

	// Save multiple logs
	for i := 0; i < 3; i++ {
		log := &domain.Log{
			TransactionHash: tx.Hash,
			LogIndex:        uint64(i),
			Address:         "0x" + strings.Repeat("e", 40),
			Topics:          []string{"0x" + strings.Repeat(string(rune('f'+i)), 64)},
			Data:            []byte{byte(i)},
			BlockNumber:     block.Number,
			BlockHash:       block.Hash,
		}
		err := repo.SaveLog(ctx, log)
		require.NoError(t, err)
	}

	// Retrieve logs
	logs, err := repo.GetLogsByTransactionHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.Len(t, logs, 3)
	// Should be ordered by log_index
	for i, log := range logs {
		assert.Equal(t, uint64(i), log.LogIndex)
	}
}

func TestLogRepository_GetLogsByAddress(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup blocks
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	block1 := &domain.Block{
		Hash:         "0x" + strings.Repeat("a", 64),
		Number:      100,
		ParentHashes: []string{},
		Timestamp:   time.Now().Unix(),
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1000,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, block1)

	block2 := &domain.Block{
		Hash:         "0x" + strings.Repeat("b", 64),
		Number:      101,
		ParentHashes: []string{block1.Hash},
		Timestamp:   time.Now().Unix() + 1,
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1001,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, block2)

	// Setup transactions
	txRepo := database.NewTransactionRepository(conn, zap.NewNop())
	tx1 := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("c", 64),
		BlockHash:        block1.Hash,
		BlockNumber:      block1.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("d", 40),
		To:               stringPtr("0x" + strings.Repeat("e", 40)),
		Value:            1000000000000000000,
		GasLimit:         21000,
		Nonce:            5,
		Input:            []byte{},
		Status:           intPtr(1),
		CreatesContract:  false,
	}
	txRepo.SaveTransaction(ctx, tx1)

	tx2 := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("f", 64),
		BlockHash:        block2.Hash,
		BlockNumber:      block2.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("d", 40),
		To:               stringPtr("0x" + strings.Repeat("e", 40)),
		Value:            1000000000000000000,
		GasLimit:         21000,
		Nonce:            6,
		Input:            []byte{},
		Status:           intPtr(1),
		CreatesContract:  false,
	}
	txRepo.SaveTransaction(ctx, tx2)

	// Save logs for same address
	repo := database.NewLogRepository(conn, zap.NewNop())
	targetAddress := "0x" + strings.Repeat("e", 40)

	log1 := &domain.Log{
		TransactionHash: tx1.Hash,
		LogIndex:        0,
		Address:         targetAddress,
		Topics:          []string{"0xtopic1"},
		Data:            []byte{0x01},
		BlockNumber:     block1.Number,
		BlockHash:       block1.Hash,
	}
	repo.SaveLog(ctx, log1)

	log2 := &domain.Log{
		TransactionHash: tx2.Hash,
		LogIndex:        0,
		Address:         targetAddress,
		Topics:          []string{"0xtopic2"},
		Data:            []byte{0x02},
		BlockNumber:     block2.Number,
		BlockHash:       block2.Hash,
	}
	repo.SaveLog(ctx, log2)

	// Get logs by address and block range
	logs, err := repo.GetLogsByAddress(ctx, targetAddress, block1.Number, block2.Number)
	require.NoError(t, err)
	assert.Len(t, logs, 2)
}

func TestLogRepository_GetLogsByAddress_EmptyResult(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	repo := database.NewLogRepository(conn, zap.NewNop())
	logs, err := repo.GetLogsByAddress(ctx, "0x"+strings.Repeat("z", 40), 0, 1000)
	require.NoError(t, err)
	assert.Len(t, logs, 0)
}

