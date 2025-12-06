package database_test

import (
	"context"
	"math/big"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestDAGRepository_SaveDAGRelationship(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup blocks
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	parentBlock := &domain.Block{
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
	err := blockRepo.SaveBlock(ctx, parentBlock)
	require.NoError(t, err)

	childBlock := &domain.Block{
		Hash:         "0x" + strings.Repeat("b", 64),
		Number:      101,
		ParentHashes: []string{parentBlock.Hash},
		Timestamp:   time.Now().Unix() + 1,
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1001,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	err = blockRepo.SaveBlock(ctx, childBlock)
	require.NoError(t, err)

	// Save DAG relationship
	repo := database.NewDAGRepository(conn, zap.NewNop())
	err = repo.SaveDAGRelationship(ctx, childBlock.Hash, parentBlock.Hash, true)
	require.NoError(t, err)

	// Verify relationship
	parents, err := repo.GetBlockParents(ctx, childBlock.Hash)
	require.NoError(t, err)
	assert.Contains(t, parents, parentBlock.Hash)
}

func TestDAGRepository_SaveDAGRelationship_MultipleParents(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup blocks
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	parent1 := &domain.Block{
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
	blockRepo.SaveBlock(ctx, parent1)

	parent2 := &domain.Block{
		Hash:         "0x" + strings.Repeat("c", 64),
		Number:      100,
		ParentHashes: []string{},
		Timestamp:   time.Now().Unix(),
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1000,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, parent2)

	childBlock := &domain.Block{
		Hash:         "0x" + strings.Repeat("b", 64),
		Number:      101,
		ParentHashes: []string{parent1.Hash, parent2.Hash},
		Timestamp:   time.Now().Unix() + 1,
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1001,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, childBlock)

	// Save DAG relationships
	repo := database.NewDAGRepository(conn, zap.NewNop())
	err := repo.SaveDAGRelationship(ctx, childBlock.Hash, parent1.Hash, true) // Selected parent
	require.NoError(t, err)

	err = repo.SaveDAGRelationship(ctx, childBlock.Hash, parent2.Hash, false) // Not selected
	require.NoError(t, err)

	// Verify relationships
	parents, err := repo.GetBlockParents(ctx, childBlock.Hash)
	require.NoError(t, err)
	assert.Len(t, parents, 2)
	assert.Contains(t, parents, parent1.Hash)
	assert.Contains(t, parents, parent2.Hash)
}

func TestDAGRepository_GetBlockChildren(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	// Setup blocks
	blockRepo := database.NewBlockRepository(conn, zap.NewNop())
	parentBlock := &domain.Block{
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
	blockRepo.SaveBlock(ctx, parentBlock)

	child1 := &domain.Block{
		Hash:         "0x" + strings.Repeat("b", 64),
		Number:      101,
		ParentHashes: []string{parentBlock.Hash},
		Timestamp:   time.Now().Unix() + 1,
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1001,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, child1)

	child2 := &domain.Block{
		Hash:         "0x" + strings.Repeat("c", 64),
		Number:      101,
		ParentHashes: []string{parentBlock.Hash},
		Timestamp:   time.Now().Unix() + 1,
		GasLimit:    21000,
		GasUsed:     21000,
		BlueScore:   1001,
		IsChainBlock: true,
		Transactions: []domain.Transaction{},
	}
	blockRepo.SaveBlock(ctx, child2)

	// Save relationships
	repo := database.NewDAGRepository(conn, zap.NewNop())
	repo.SaveDAGRelationship(ctx, child1.Hash, parentBlock.Hash, true)
	repo.SaveDAGRelationship(ctx, child2.Hash, parentBlock.Hash, false)

	// Get children
	children, err := repo.GetBlockChildren(ctx, parentBlock.Hash)
	require.NoError(t, err)
	assert.Len(t, children, 2)
	assert.Contains(t, children, child1.Hash)
	assert.Contains(t, children, child2.Hash)
}

func TestDAGRepository_SaveGHOSTDAGData(t *testing.T) {
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

	// Save GHOSTDAG data
	repo := database.NewDAGRepository(conn, zap.NewNop())
	ghostDAGData := &domain.GHOSTDAGData{
		BlockHash:      block.Hash,
		BlueScore:      1000,
		BlueWork:       big.NewInt(5000),
		SelectedParent: "0x" + strings.Repeat("b", 64),
		MergeSetBlues:  []string{"0x" + strings.Repeat("c", 64)},
		MergeSetReds:   []string{"0x" + strings.Repeat("d", 64)},
	}

	err = repo.SaveGHOSTDAGData(ctx, block.Hash, ghostDAGData)
	require.NoError(t, err)

	// Verify GHOSTDAG data
	saved, err := repo.GetGHOSTDAGData(ctx, block.Hash)
	require.NoError(t, err)
	assert.Equal(t, ghostDAGData.BlueScore, saved.BlueScore)
	assert.Equal(t, ghostDAGData.BlueWork.String(), saved.BlueWork.String())
	assert.Equal(t, ghostDAGData.SelectedParent, saved.SelectedParent)
}

func TestDAGRepository_GetGHOSTDAGData_NotFound(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()

	repo := database.NewDAGRepository(conn, zap.NewNop())
	_, err := repo.GetGHOSTDAGData(ctx, "0x"+strings.Repeat("z", 64))
	assert.Error(t, err)
}

