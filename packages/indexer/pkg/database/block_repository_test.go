package database_test

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

const blockRepoTestDatabaseURL = "postgresql://phoenix:phoenix_dev@localhost:5433/phoenix_explorer_test?sslmode=disable"

func setupBlockRepoTestDB(t *testing.T) (*pgx.Conn, func()) {
	conn, err := pgx.Connect(context.Background(), blockRepoTestDatabaseURL)
	if err != nil {
		t.Skipf("Skipping test: database not available: %v", err)
		return nil, nil
	}

	ctx := context.Background()

	// Run migrations first
	migrator := database.NewMigrator(conn, zap.NewNop())
	if err := migrator.Migrate(ctx); err != nil {
		conn.Close(ctx)
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Clean up tables
	_, _ = conn.Exec(ctx, "TRUNCATE TABLE transactions CASCADE")
	_, _ = conn.Exec(ctx, "TRUNCATE TABLE dag_relationships CASCADE")
	_, _ = conn.Exec(ctx, "TRUNCATE TABLE ghostdag_data CASCADE")
	_, _ = conn.Exec(ctx, "TRUNCATE TABLE blocks CASCADE")

	cleanup := func() {
		conn.Close(ctx)
	}

	return conn, cleanup
}

func TestBlockRepository_SaveBlock(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewBlockRepository(conn, zap.NewNop())

	block := &domain.Block{
		Hash:           "0x" + strings.Repeat("a", 64),
		Number:         100,
		ParentHashes:   []string{"0x" + strings.Repeat("b", 64)},
		Timestamp:      time.Now().Unix(),
		Miner:          "0x" + strings.Repeat("c", 40),
		GasLimit:       21000,
		GasUsed:        21000,
		BaseFeePerGas:  uintPtr(1000000000),
		BlueScore:      1000,
		IsChainBlock:   true,
		SelectedParent: "0x" + strings.Repeat("b", 64),
		Transactions:   []domain.Transaction{},
	}

	err := repo.SaveBlock(ctx, block)
	require.NoError(t, err)

	// Verify block was saved
	saved, err := repo.GetBlockByHash(ctx, block.Hash)
	require.NoError(t, err)
	assert.Equal(t, block.Hash, saved.Hash)
	assert.Equal(t, block.Number, saved.Number)
	assert.Equal(t, block.BlueScore, saved.BlueScore)
}

func TestBlockRepository_GetBlockByHash(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewBlockRepository(conn, zap.NewNop())

	// Save a block first
	block := &domain.Block{
		Hash:         "0x" + strings.Repeat("a", 64),
		Number:      100,
		ParentHashes: []string{"0x" + strings.Repeat("b", 64)},
		Timestamp:   time.Now().Unix(),
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1000,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}

	err := repo.SaveBlock(ctx, block)
	require.NoError(t, err)

	// Retrieve block
	saved, err := repo.GetBlockByHash(ctx, block.Hash)
	require.NoError(t, err)
	assert.Equal(t, block.Hash, saved.Hash)
	assert.Equal(t, block.Number, saved.Number)

	// Test non-existent block
	_, err = repo.GetBlockByHash(ctx, "0x"+strings.Repeat("z", 64))
	assert.Error(t, err)
}

func TestBlockRepository_GetBlockByNumber(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewBlockRepository(conn, zap.NewNop())

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

	err := repo.SaveBlock(ctx, block)
	require.NoError(t, err)

	saved, err := repo.GetBlockByNumber(ctx, 100)
	require.NoError(t, err)
	assert.Equal(t, block.Hash, saved.Hash)
}

func TestBlockRepository_GetLatestBlocks(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewBlockRepository(conn, zap.NewNop())

	// Save multiple blocks
	for i := 0; i < 5; i++ {
		block := &domain.Block{
			Hash:         "0x" + strings.Repeat(string(rune('a'+i)), 64),
			Number:      int64(100 + i),
			ParentHashes: []string{},
			Timestamp:   time.Now().Unix() + int64(i),
			GasLimit:    21000,
			GasUsed:     21000,
			BlueScore:   uint64(1000 + i),
			IsChainBlock: true,
			Transactions: []domain.Transaction{},
		}
		err := repo.SaveBlock(ctx, block)
		require.NoError(t, err)
	}

	// Get latest 3 blocks
	latest, err := repo.GetLatestBlocks(ctx, 3)
	require.NoError(t, err)
	assert.Len(t, latest, 3)
	// Should be ordered by number DESC
	assert.GreaterOrEqual(t, latest[0].Number, latest[1].Number)
}

func TestBlockRepository_UpdateBlock(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewBlockRepository(conn, zap.NewNop())

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

	err := repo.SaveBlock(ctx, block)
	require.NoError(t, err)

	// Update block
	updates := map[string]interface{}{
		"gas_used": uint64(30000),
		"blue_score": uint64(2000),
	}

	err = repo.UpdateBlock(ctx, block.Hash, updates)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetBlockByHash(ctx, block.Hash)
	require.NoError(t, err)
	assert.Equal(t, uint64(30000), updated.GasUsed)
	assert.Equal(t, uint64(2000), updated.BlueScore)
}

func uintPtr(u uint64) *uint64 {
	return &u
}

