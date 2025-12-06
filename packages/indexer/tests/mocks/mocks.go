package mocks

import (
	"context"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/mock"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

//go:generate mockery --name=BlockByNumberReader --output=. --filename=mock_block_by_number_reader.go
//go:generate mockery --name=BlockWriter --output=. --filename=mock_block_writer.go
//go:generate mockery --name=TransactionWriter --output=. --filename=mock_transaction_writer.go

// MockPhoenixClient is a mock implementation of PhoenixRPCClient
type MockPhoenixClient struct {
	mock.Mock
}

func (m *MockPhoenixClient) BlockNumber(ctx context.Context) (*big.Int, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*big.Int), args.Error(1)
}

func (m *MockPhoenixClient) GetBlockByNumber(ctx context.Context, number *big.Int, fullTx bool) (*interfaces.Block, error) {
	args := m.Called(ctx, number, fullTx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*interfaces.Block), args.Error(1)
}

func (m *MockPhoenixClient) GetBlockByHash(ctx context.Context, hash common.Hash, fullTx bool) (*interfaces.Block, error) {
	args := m.Called(ctx, hash, fullTx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*interfaces.Block), args.Error(1)
}

func (m *MockPhoenixClient) GetTransactionReceipt(ctx context.Context, hash common.Hash) (*interfaces.Receipt, error) {
	args := m.Called(ctx, hash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*interfaces.Receipt), args.Error(1)
}

func (m *MockPhoenixClient) GetLogs(ctx context.Context, filter interfaces.FilterQuery) ([]interfaces.Log, error) {
	args := m.Called(ctx, filter)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]interfaces.Log), args.Error(1)
}

func (m *MockPhoenixClient) GetCode(ctx context.Context, address common.Address) ([]byte, error) {
	args := m.Called(ctx, address)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]byte), args.Error(1)
}

func (m *MockPhoenixClient) GetDAGInfo(ctx context.Context) (*interfaces.DAGInfo, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*interfaces.DAGInfo), args.Error(1)
}

func (m *MockPhoenixClient) GetBlueScore(ctx context.Context, blockNumber *big.Int) (uint64, error) {
	args := m.Called(ctx, blockNumber)
	return args.Get(0).(uint64), args.Error(1)
}

func (m *MockPhoenixClient) GetBlockParents(ctx context.Context, hash common.Hash) ([]common.Hash, error) {
	args := m.Called(ctx, hash)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]common.Hash), args.Error(1)
}

// MockBlockWriter is a mock implementation of BlockWriter
type MockBlockWriter struct {
	mock.Mock
}

func (m *MockBlockWriter) SaveBlock(ctx context.Context, block *domain.Block) error {
	args := m.Called(ctx, block)
	return args.Error(0)
}

func (m *MockBlockWriter) UpdateBlock(ctx context.Context, hash string, updates map[string]interface{}) error {
	args := m.Called(ctx, hash, updates)
	return args.Error(0)
}

// MockTransactionWriter is a mock implementation of TransactionWriter
type MockTransactionWriter struct {
	mock.Mock
}

func (m *MockTransactionWriter) SaveTransaction(ctx context.Context, tx *domain.Transaction) error {
	args := m.Called(ctx, tx)
	return args.Error(0)
}

func (m *MockTransactionWriter) UpdateTransactionStatus(ctx context.Context, hash string, status int, gasUsed uint64) error {
	args := m.Called(ctx, hash, status, gasUsed)
	return args.Error(0)
}

// MockLogWriter is a mock implementation of LogWriter
type MockLogWriter struct {
	mock.Mock
}

func (m *MockLogWriter) SaveLog(ctx context.Context, log *domain.Log) error {
	args := m.Called(ctx, log)
	return args.Error(0)
}

// MockDAGWriter is a mock implementation of DAGWriter
type MockDAGWriter struct {
	mock.Mock
}

func (m *MockDAGWriter) SaveDAGRelationship(ctx context.Context, childHash, parentHash string, isSelectedParent bool) error {
	args := m.Called(ctx, childHash, parentHash, isSelectedParent)
	return args.Error(0)
}

func (m *MockDAGWriter) SaveGHOSTDAGData(ctx context.Context, blockHash string, data *domain.GHOSTDAGData) error {
	args := m.Called(ctx, blockHash, data)
	return args.Error(0)
}

