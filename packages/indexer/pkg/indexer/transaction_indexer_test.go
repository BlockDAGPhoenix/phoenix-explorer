package indexer_test

import (
	"context"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/indexer"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/tests/mocks"
)

func TestTransactionIndexer_IndexTransactionReceipt(t *testing.T) {
	// Setup mocks
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Expected receipt from RPC
	expectedReceipt := &interfaces.Receipt{
		TransactionHash: txHash.Hex(),
		Status:          1, // Success
		GasUsed:         21000,
		Logs: []interfaces.Log{
			{
				Address: "0x" + strings.Repeat("b", 40),
				Topics:  []string{"0x" + strings.Repeat("c", 64)},
				Data:    []byte{0x01, 0x02},
			},
		},
	}

	// Setup expectations (TDD: define behavior first)
	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(expectedReceipt, nil)

	mockTxWriter.On("UpdateTransactionStatus", ctx, txHash.Hex(), 1, uint64(21000)).
		Return(nil)

	mockLogWriter.On("SaveLog", ctx, mock.AnythingOfType("*domain.Log")).
		Return(nil).Times(1)

	// Create indexer
	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	// Execute
	err := idx.IndexTransactionReceipt(ctx, txHash)

	// Assert
	assert.NoError(t, err)
	mockRPC.AssertExpectations(t)
	mockTxWriter.AssertExpectations(t)
	mockLogWriter.AssertExpectations(t)
}

func TestTransactionIndexer_IndexTransactionReceipt_RPCFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// RPC returns error
	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(nil, assert.AnError)

	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	err := idx.IndexTransactionReceipt(ctx, txHash)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "fetch receipt")
}

func TestTransactionIndexer_IndexTransactionReceipt_ReceiptNotFound(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Receipt not found (nil response)
	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(nil, nil)

	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	err := idx.IndexTransactionReceipt(ctx, txHash)

	assert.NoError(t, err) // Not an error, just not found
}

func TestTransactionIndexer_IndexTransactionReceipt_FailedTransaction(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Failed transaction receipt
	failedReceipt := &interfaces.Receipt{
		TransactionHash: txHash.Hex(),
		Status:          0, // Failed
		GasUsed:         21000,
		Logs:            []interfaces.Log{},
	}

	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(failedReceipt, nil)

	mockTxWriter.On("UpdateTransactionStatus", ctx, txHash.Hex(), 0, uint64(21000)).
		Return(nil)

	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	err := idx.IndexTransactionReceipt(ctx, txHash)

	assert.NoError(t, err)
	mockTxWriter.AssertExpectations(t)
	// No logs should be saved for failed transactions
}

func TestTransactionIndexer_IndexTransactionReceipt_MultipleLogs(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	// Receipt with multiple logs
	receipt := &interfaces.Receipt{
		TransactionHash: txHash.Hex(),
		Status:          1,
		GasUsed:         50000,
		Logs: []interfaces.Log{
			{Address: "0x" + strings.Repeat("b", 40), Topics: []string{"0xtopic1"}},
			{Address: "0x" + strings.Repeat("c", 40), Topics: []string{"0xtopic2"}},
			{Address: "0x" + strings.Repeat("d", 40), Topics: []string{"0xtopic3"}},
		},
	}

	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(receipt, nil)

	mockTxWriter.On("UpdateTransactionStatus", ctx, txHash.Hex(), 1, uint64(50000)).
		Return(nil)

	mockLogWriter.On("SaveLog", ctx, mock.AnythingOfType("*domain.Log")).
		Return(nil).Times(3)

	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	err := idx.IndexTransactionReceipt(ctx, txHash)

	assert.NoError(t, err)
	mockLogWriter.AssertExpectations(t)
}

func TestTransactionIndexer_IndexTransactionReceipt_LogSaveFailure(t *testing.T) {
	mockRPC := new(mocks.MockPhoenixClient)
	mockTxWriter := new(mocks.MockTransactionWriter)
	mockLogWriter := new(mocks.MockLogWriter)

	ctx := context.Background()
	txHash := common.HexToHash("0x" + strings.Repeat("a", 64))

	receipt := &interfaces.Receipt{
		TransactionHash: txHash.Hex(),
		Status:          1,
		GasUsed:         21000,
		Logs: []interfaces.Log{
			{Address: "0x" + strings.Repeat("b", 40), Topics: []string{"0xtopic1"}},
		},
	}

	mockRPC.On("GetTransactionReceipt", ctx, txHash).
		Return(receipt, nil)

	mockTxWriter.On("UpdateTransactionStatus", ctx, txHash.Hex(), 1, uint64(21000)).
		Return(nil)

	// Log save fails, but should continue
	mockLogWriter.On("SaveLog", ctx, mock.AnythingOfType("*domain.Log")).
		Return(assert.AnError)

	idx := indexer.NewTransactionIndexer(indexer.TransactionIndexerDeps{
		RPC:    mockRPC,
		TxDB:   mockTxWriter,
		LogDB:  mockLogWriter,
		Logger: nil,
	})

	err := idx.IndexTransactionReceipt(ctx, txHash)

	// Should not fail completely, just log warning
	assert.NoError(t, err)
}

