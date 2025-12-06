package indexer_test

import (
	"context"
	"math/big"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/indexer"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/tests/mocks"
)

func TestDAGIndexer_IndexBlockDAGRelationships(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockDAGDB := new(mocks.MockDAGWriter)

	ctx := context.Background()
	blockHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Mock parent hashes
	parent1 := common.HexToHash("0x" + strings.Repeat("b", 64))
	parent2 := common.HexToHash("0x" + strings.Repeat("c", 64))
	expectedParents := []common.Hash{parent1, parent2}

	// Setup expectations
	mockRPC.On("GetBlockParents", ctx, blockHash).
		Return(expectedParents, nil)

	// First parent is selected parent
	mockDAGDB.On("SaveDAGRelationship", ctx, blockHash.Hex(), parent1.Hex(), true).
		Return(nil)
	mockDAGDB.On("SaveDAGRelationship", ctx, blockHash.Hex(), parent2.Hex(), false).
		Return(nil)

	idx := indexer.NewDAGIndexer(indexer.DAGIndexerDeps{
		ParentsRPC:  mockRPC,
		DAGInfoRPC:  mockRPC,
		BlueScoreRPC: mockRPC,
		DAGDB:       mockDAGDB,
		Logger:      nil,
	})

	err := idx.IndexBlockDAGRelationships(ctx, blockHash, parent1.Hex())

	assert.NoError(t, err)
	mockRPC.AssertExpectations(t)
	mockDAGDB.AssertExpectations(t)
}

func TestDAGIndexer_IndexBlockDAGRelationships_RPCFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockDAGDB := new(mocks.MockDAGWriter)

	ctx := context.Background()
	blockHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	mockRPC.On("GetBlockParents", ctx, blockHash).
		Return(nil, assert.AnError)

	idx := indexer.NewDAGIndexer(indexer.DAGIndexerDeps{
		ParentsRPC:  mockRPC,
		DAGInfoRPC:  mockRPC,
		BlueScoreRPC: mockRPC,
		DAGDB:       mockDAGDB,
		Logger:      nil,
	})

	err := idx.IndexBlockDAGRelationships(ctx, blockHash, "")

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetch parents")
}

func TestDAGIndexer_IndexBlockDAGRelationships_NoParents(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockDAGDB := new(mocks.MockDAGWriter)

	ctx := context.Background()
	blockHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Genesis block has no parents
	mockRPC.On("GetBlockParents", ctx, blockHash).
		Return([]common.Hash{}, nil)

	idx := indexer.NewDAGIndexer(indexer.DAGIndexerDeps{
		ParentsRPC:  mockRPC,
		DAGInfoRPC:  mockRPC,
		BlueScoreRPC: mockRPC,
		DAGDB:       mockDAGDB,
		Logger:      nil,
	})

	err := idx.IndexBlockDAGRelationships(ctx, blockHash, "")

	assert.NoError(t, err)
	// No relationships should be saved
}

func TestDAGIndexer_IndexGHOSTDAGData(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockDAGDB := new(mocks.MockDAGWriter)

	ctx := context.Background()
	blockHash := common.HexToHash("0x" + strings.Repeat("a", 64))
	blockNumber := big.NewInt(100)

	// Mock DAG info
	dagInfo := &interfaces.DAGInfo{
		BlueScore:     1000,
		BlueWork:      big.NewInt(5000),
		MergeSetBlues: []string{"0x" + strings.Repeat("b", 64)},
		MergeSetReds:  []string{"0x" + strings.Repeat("c", 64)},
	}

	mockRPC.On("GetDAGInfo", ctx).
		Return(dagInfo, nil)

	mockRPC.On("GetBlueScore", ctx, blockNumber).
		Return(uint64(1000), nil)

	ghostDAGData := &domain.GHOSTDAGData{
		BlockHash:     blockHash.Hex(),
		BlueScore:     1000,
		BlueWork:      big.NewInt(5000),
		MergeSetBlues: []string{"0x" + strings.Repeat("b", 64)},
		MergeSetReds:  []string{"0x" + strings.Repeat("c", 64)},
	}

	mockDAGDB.On("SaveGHOSTDAGData", ctx, blockHash.Hex(), ghostDAGData).
		Return(nil)

	idx := indexer.NewDAGIndexer(indexer.DAGIndexerDeps{
		ParentsRPC:  mockRPC,
		DAGInfoRPC:  mockRPC,
		BlueScoreRPC: mockRPC,
		DAGDB:       mockDAGDB,
		Logger:      nil,
	})

	err := idx.IndexGHOSTDAGData(ctx, blockHash, blockNumber)

	assert.NoError(t, err)
	mockDAGDB.AssertExpectations(t)
}

func TestDAGIndexer_IndexGHOSTDAGData_RPCFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockDAGDB := new(mocks.MockDAGWriter)

	ctx := context.Background()
	blockHash := common.HexToHash("0x" + strings.Repeat("a", 64))
	blockNumber := big.NewInt(100)

	mockRPC.On("GetDAGInfo", ctx).
		Return(nil, assert.AnError)

	idx := indexer.NewDAGIndexer(indexer.DAGIndexerDeps{
		ParentsRPC:  mockRPC,
		DAGInfoRPC:  mockRPC,
		BlueScoreRPC: mockRPC,
		DAGDB:       mockDAGDB,
		Logger:      nil,
	})

	err := idx.IndexGHOSTDAGData(ctx, blockHash, blockNumber)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetch DAG info")
}

