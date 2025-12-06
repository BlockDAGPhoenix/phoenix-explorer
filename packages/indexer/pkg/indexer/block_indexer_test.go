package indexer_test

import (
	"context"
	"math/big"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/indexer"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/tests/mocks"
)

func TestBlockIndexer_IndexBlock(t *testing.T) {
	// Setup mocks
	mockRPC := new(mocks.MockPhoenixClient)
	mockBlockWriter := new(mocks.MockBlockWriter)
	mockTxWriter := new(mocks.MockTransactionWriter)

	ctx := context.Background()
	blockNum := big.NewInt(100)

	// Expected block from RPC (interfaces.Block)
	expectedRPCBlock := &interfaces.Block{
		Hash:         "0x" + strings.Repeat("a", 64),
		Number:       100,
		ParentHashes: []string{"0x" + strings.Repeat("b", 64)},
		Timestamp:    1706150400000,
		GasLimit:     30000000,
		GasUsed:      21000,
		BlueScore:    100,
		Transactions: []interfaces.Transaction{
			{
				Hash:    "0x" + strings.Repeat("c", 64),
				From:    "0x" + strings.Repeat("d", 40),
				To:      stringPtr("0x" + strings.Repeat("e", 40)),
				Gas:     21000,
				Nonce:   5,
			},
		},
	}

	// Setup expectations (TDD: define behavior first)
	mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
		Return(expectedRPCBlock, nil)

	// Expect SaveBlock to be called with converted domain.Block
	mockBlockWriter.On("SaveBlock", ctx, mock.AnythingOfType("*domain.Block")).
		Return(nil)

	mockTxWriter.On("SaveTransaction", ctx, mock.AnythingOfType("*domain.Transaction")).
		Return(nil).Times(1)

	// Create indexer
	idx := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    mockRPC,
		DB:     mockBlockWriter,
		TxDB:   mockTxWriter,
		Logger: nil,
	})

	// Execute
	err := idx.IndexBlock(ctx, blockNum)

	// Assert
	if !assert.NoError(t, err) {
		return
	}
	mockRPC.AssertExpectations(t)
	mockBlockWriter.AssertExpectations(t)
	mockTxWriter.AssertExpectations(t)
}

func TestBlockIndexer_IndexBlock_RPCFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockBlockWriter := new(mocks.MockBlockWriter)
	mockTxWriter := new(mocks.MockTransactionWriter)

	ctx := context.Background()
	blockNum := big.NewInt(100)

	// RPC returns error
	mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
		Return(nil, assert.AnError)

	idx := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    mockRPC,
		DB:     mockBlockWriter,
		TxDB:   mockTxWriter,
		Logger: nil,
	})

	err := idx.IndexBlock(ctx, blockNum)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetch block")
}

func TestBlockIndexer_IndexBlock_DatabaseFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockBlockWriter := new(mocks.MockBlockWriter)
	mockTxWriter := new(mocks.MockTransactionWriter)

	ctx := context.Background()
	blockNum := big.NewInt(100)

	expectedRPCBlock := &interfaces.Block{
		Hash:      "0x" + strings.Repeat("a", 64),
		Number:    100,
		Timestamp: 1706150400000,
	}

	mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
		Return(expectedRPCBlock, nil)

	// Database save fails
	mockBlockWriter.On("SaveBlock", ctx, mock.AnythingOfType("*domain.Block")).
		Return(assert.AnError)

	idx := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    mockRPC,
		DB:     mockBlockWriter,
		TxDB:   mockTxWriter,
		Logger: nil,
	})

	err := idx.IndexBlock(ctx, blockNum)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "save block")
}

func TestBlockIndexer_IndexBlock_InvalidBlock(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockBlockWriter := new(mocks.MockBlockWriter)
	mockTxWriter := new(mocks.MockTransactionWriter)

	ctx := context.Background()
	blockNum := big.NewInt(100)

	// Invalid block (missing required fields)
	invalidRPCBlock := &interfaces.Block{
		Hash: "invalid", // Invalid hash format
	}

	mockRPC.On("GetBlockByNumber", ctx, blockNum, true).
		Return(invalidRPCBlock, nil)

	idx := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    mockRPC,
		DB:     mockBlockWriter,
		TxDB:   mockTxWriter,
		Logger: nil,
	})

	err := idx.IndexBlock(ctx, blockNum)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid block")
}

func TestBlockIndexer_IndexBlockRange(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockBlockWriter := new(mocks.MockBlockWriter)
	mockTxWriter := new(mocks.MockTransactionWriter)

	ctx := context.Background()
	fromBlock := big.NewInt(100)
	toBlock := big.NewInt(102)

	// Setup expectations for 3 blocks
	for i := int64(100); i <= 102; i++ {
		rpcBlock := &interfaces.Block{
			Hash:      "0x" + strings.Repeat("a", 64),
			Number:    i,
			Timestamp: 1706150400000 + (i-100)*1000,
		}
		mockRPC.On("GetBlockByNumber", ctx, big.NewInt(i), true).
			Return(rpcBlock, nil)
		mockBlockWriter.On("SaveBlock", ctx, mock.AnythingOfType("*domain.Block")).Return(nil)
	}

	idx := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    mockRPC,
		DB:     mockBlockWriter,
		TxDB:   mockTxWriter,
		Logger: nil,
	})

	err := idx.IndexBlockRange(ctx, fromBlock, toBlock)

	assert.NoError(t, err)
	mockRPC.AssertExpectations(t)
	mockBlockWriter.AssertExpectations(t)
}

func stringPtr(s string) *string {
	return &s
}

