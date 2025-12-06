package interfaces

import (
	"context"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
)

// BlockNumberReader reads the current block number (ISP: Single responsibility)
type BlockNumberReader interface {
	BlockNumber(ctx context.Context) (*big.Int, error)
}

// BlockByNumberReader reads blocks by number (ISP: Single responsibility)
type BlockByNumberReader interface {
	GetBlockByNumber(ctx context.Context, number *big.Int, fullTx bool) (*Block, error)
}

// BlockByHashReader reads blocks by hash (ISP: Single responsibility)
type BlockByHashReader interface {
	GetBlockByHash(ctx context.Context, hash common.Hash, fullTx bool) (*Block, error)
}

// ReceiptReader reads transaction receipts (ISP: Single responsibility)
type ReceiptReader interface {
	GetTransactionReceipt(ctx context.Context, hash common.Hash) (*Receipt, error)
}

// EventLogReader reads event logs from RPC (ISP: Single responsibility)
type EventLogReader interface {
	GetLogs(ctx context.Context, filter FilterQuery) ([]Log, error)
}

// CodeReader reads contract code (ISP: Single responsibility)
type CodeReader interface {
	GetCode(ctx context.Context, address common.Address) ([]byte, error)
}

// Phoenix-specific RPC interfaces

// DAGInfoReader reads DAG information (ISP: Single responsibility)
type DAGInfoReader interface {
	GetDAGInfo(ctx context.Context) (*DAGInfo, error)
}

// BlueScoreReader reads blue score (ISP: Single responsibility)
type BlueScoreReader interface {
	GetBlueScore(ctx context.Context, blockNumber *big.Int) (uint64, error)
}

// BlockParentsReader reads block parents (ISP: Single responsibility)
type BlockParentsReader interface {
	GetBlockParents(ctx context.Context, hash common.Hash) ([]common.Hash, error)
}

// Composite interface for Phoenix RPC client
// Combines multiple interfaces but each is still segregated
type PhoenixRPCClient interface {
	BlockNumberReader
	BlockByNumberReader
	BlockByHashReader
	ReceiptReader
	DAGInfoReader
	BlueScoreReader
	BlockParentsReader
}

// Data structures for RPC responses

// Block represents a block from Phoenix RPC
type Block struct {
	Hash             string
	Number           int64
	ParentHashes     []string
	Timestamp        int64
	Miner            string
	GasLimit         uint64
	GasUsed          uint64
	BaseFeePerGas    *uint64
	BlueScore        uint64
	IsChainBlock     bool
	SelectedParent   string
	Transactions     []Transaction
}

// Transaction represents a transaction from Phoenix RPC
type Transaction struct {
	Hash    string
	From    string
	To      *string
	Value   *big.Int
	Gas     uint64
	GasPrice *big.Int
	Nonce   uint64
	Input   []byte
}

// Receipt represents a transaction receipt
type Receipt struct {
	TransactionHash string
	Status          int
	GasUsed         uint64
	Logs            []Log
}

// Log represents an event log
type Log struct {
	Address string
	Topics  []string
	Data    []byte
}

// FilterQuery represents a filter query for logs
type FilterQuery struct {
	FromBlock *big.Int
	ToBlock   *big.Int
	Addresses []common.Address
	Topics    [][]common.Hash
}

// DAGInfo represents DAG information
type DAGInfo struct {
	BlueScore    uint64
	BlueWork     *big.Int
	MergeSetBlues []string
	MergeSetReds  []string
}

