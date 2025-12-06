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

func TestTransactionRepository_SaveTransaction(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// First, save a block (required for foreign key)
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

	// Now save transaction
	repo := database.NewTransactionRepository(conn, zap.NewNop())

	tx := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("b", 64),
		BlockHash:        block.Hash,
		BlockNumber:      block.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("c", 40),
		To:               stringPtr("0x" + strings.Repeat("d", 40)),
		Value:            1000000000000000000, // 1 ETH
		GasLimit:         21000,
		GasPrice:         uintPtr(20000000000), // 20 Gwei
		Nonce:            5,
		Input:            []byte{0x01, 0x02, 0x03},
		Status:           intPtr(1), // Success
		CreatesContract:  false,
	}

	err = repo.SaveTransaction(ctx, tx)
	require.NoError(t, err)

	// Verify transaction was saved
	saved, err := repo.GetTransactionByHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.Equal(t, tx.Hash, saved.Hash)
	assert.Equal(t, tx.BlockHash, saved.BlockHash)
	assert.Equal(t, tx.From, saved.From)
}

func TestTransactionRepository_GetTransactionByHash(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup block
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

	repo := database.NewTransactionRepository(conn, zap.NewNop())

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

	err = repo.SaveTransaction(ctx, tx)
	require.NoError(t, err)

	// Retrieve transaction
	saved, err := repo.GetTransactionByHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.Equal(t, tx.Hash, saved.Hash)
	assert.Equal(t, tx.From, saved.From)

	// Test non-existent transaction
	_, err = repo.GetTransactionByHash(ctx, "0x"+strings.Repeat("z", 64))
	assert.Error(t, err)
}

func TestTransactionRepository_GetTransactionsByBlockHash(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup block
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

	repo := database.NewTransactionRepository(conn, zap.NewNop())

	// Save multiple transactions
	for i := 0; i < 3; i++ {
		tx := &domain.Transaction{
			Hash:             "0x" + strings.Repeat(string(rune('b'+i)), 64),
			BlockHash:        block.Hash,
			BlockNumber:      block.Number,
			TransactionIndex: i,
			From:             "0x" + strings.Repeat("c", 40),
			To:               stringPtr("0x" + strings.Repeat("d", 40)),
			Value:            1000000000000000000,
			GasLimit:         21000,
			Nonce:            uint64(i),
			Input:            []byte{},
			Status:           intPtr(1),
			CreatesContract:  false,
		}
		err := repo.SaveTransaction(ctx, tx)
		require.NoError(t, err)
	}

	// Retrieve all transactions for block
	txs, err := repo.GetTransactionsByBlockHash(ctx, block.Hash)
	require.NoError(t, err)
	assert.Len(t, txs, 3)
}

func TestTransactionRepository_UpdateTransactionStatus(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup block
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

	repo := database.NewTransactionRepository(conn, zap.NewNop())

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
		Status:           nil, // Pending
		CreatesContract:  false,
	}

	err = repo.SaveTransaction(ctx, tx)
	require.NoError(t, err)

	// Update transaction status
	err = repo.UpdateTransactionStatus(ctx, tx.Hash, 1, 21000)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetTransactionByHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.NotNil(t, updated.Status)
	assert.Equal(t, 1, *updated.Status)
	assert.NotNil(t, updated.GasUsed)
	assert.Equal(t, uint64(21000), *updated.GasUsed)
}

func TestTransactionRepository_ContractCreation(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup block
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

	repo := database.NewTransactionRepository(conn, zap.NewNop())

	// Contract creation transaction (To is nil)
	tx := &domain.Transaction{
		Hash:             "0x" + strings.Repeat("b", 64),
		BlockHash:        block.Hash,
		BlockNumber:      block.Number,
		TransactionIndex: 0,
		From:             "0x" + strings.Repeat("c", 40),
		To:               nil, // Contract creation
		Value:            0,
		GasLimit:         500000,
		Nonce:            5,
		Input:            []byte{0x60, 0x60, 0x60}, // Contract bytecode
		Status:           intPtr(1),
		CreatesContract:  true,
		ContractAddress:  stringPtr("0x" + strings.Repeat("e", 40)),
	}

	err = repo.SaveTransaction(ctx, tx)
	require.NoError(t, err)

	// Verify contract creation
	saved, err := repo.GetTransactionByHash(ctx, tx.Hash)
	require.NoError(t, err)
	assert.True(t, saved.CreatesContract)
	assert.Nil(t, saved.To)
	assert.NotNil(t, saved.ContractAddress)
}

func stringPtr(s string) *string {
	return &s
}

func intPtr(i int) *int {
	return &i
}

