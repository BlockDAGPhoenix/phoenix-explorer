package interfaces

import (
	"context"
	"math/big"

	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// BlockWriter defines methods for writing blocks (ISP: Write operations only)
type BlockWriter interface {
	SaveBlock(ctx context.Context, block *domain.Block) error
	UpdateBlock(ctx context.Context, hash string, updates map[string]interface{}) error
}

// BlockReader defines methods for reading blocks (ISP: Read operations only)
type BlockReader interface {
	GetBlockByHash(ctx context.Context, hash string) (*domain.Block, error)
	GetBlockByNumber(ctx context.Context, number int64) (*domain.Block, error)
	GetLatestBlocks(ctx context.Context, limit int) ([]*domain.Block, error)
}

// BlockStatistics defines methods for block statistics (ISP: Statistics only)
type BlockStatistics interface {
	GetBlockCount(ctx context.Context) (int64, error)
	GetAverageBlockTime(ctx context.Context) (float64, error)
}

// TransactionWriter defines methods for writing transactions (ISP: Write operations only)
type TransactionWriter interface {
	SaveTransaction(ctx context.Context, tx *domain.Transaction) error
	UpdateTransactionStatus(ctx context.Context, hash string, status int, gasUsed uint64) error
}

// TransactionReader defines methods for reading transactions (ISP: Read operations only)
type TransactionReader interface {
	GetTransactionByHash(ctx context.Context, hash string) (*domain.Transaction, error)
	GetTransactionsByBlockHash(ctx context.Context, blockHash string) ([]*domain.Transaction, error)
}

// LogWriter defines methods for writing logs (ISP: Write operations only)
type LogWriter interface {
	SaveLog(ctx context.Context, log *domain.Log) error
}

// LogReader defines methods for reading logs (ISP: Read operations only)
type LogReader interface {
	GetLogsByTransactionHash(ctx context.Context, txHash string) ([]*domain.Log, error)
	GetLogsByAddress(ctx context.Context, address string, fromBlock, toBlock int64) ([]*domain.Log, error)
}

// DAGWriter defines methods for writing DAG relationships (ISP: DAG write operations only)
type DAGWriter interface {
	SaveDAGRelationship(ctx context.Context, childHash, parentHash string, isSelectedParent bool) error
	SaveGHOSTDAGData(ctx context.Context, blockHash string, data *domain.GHOSTDAGData) error
}

// DAGReader defines methods for reading DAG relationships (ISP: DAG read operations only)
type DAGReader interface {
	GetBlockParents(ctx context.Context, blockHash string) ([]string, error)
	GetBlockChildren(ctx context.Context, blockHash string) ([]string, error)
	GetGHOSTDAGData(ctx context.Context, blockHash string) (*domain.GHOSTDAGData, error)
}

// AddressWriter defines methods for writing address data (ISP: Address write operations only)
type AddressWriter interface {
	SaveAddress(ctx context.Context, address *domain.Address) error
	UpdateAddressBalance(ctx context.Context, address string, balance *big.Int) error
	UpdateAddressNonce(ctx context.Context, address string, nonce uint64) error
}

// AddressReader defines methods for reading address data (ISP: Address read operations only)
type AddressReader interface {
	GetAddress(ctx context.Context, address string) (*domain.Address, error)
	GetAddressBalance(ctx context.Context, address string) (*big.Int, error)
}

// Composite interfaces for convenience (but still segregated)
// These combine multiple interfaces but don't force clients to implement unused methods

// BlockRepository combines read and write operations for blocks
type BlockRepository interface {
	BlockReader
	BlockWriter
}

// TransactionRepository combines read and write operations for transactions
type TransactionRepository interface {
	TransactionReader
	TransactionWriter
}

// LogRepository combines read and write operations for logs
type LogRepository interface {
	LogReader
	LogWriter
}

// DAGRepository combines read and write operations for DAG
type DAGRepository interface {
	DAGReader
	DAGWriter
}

// AddressRepository combines read and write operations for addresses
type AddressRepository interface {
	AddressReader
	AddressWriter
}
