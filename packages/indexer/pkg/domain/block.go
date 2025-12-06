package domain

import "errors"

// Block represents a block in the Phoenix BlockDAG
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
	TransactionsRoot string
	StateRoot        string
	ReceiptsRoot     string
	Transactions     []Transaction
}

// Validate validates the block structure
func (b *Block) Validate() error {
	if !hashRegex.MatchString(b.Hash) {
		return errors.New("invalid block hash format")
	}

	if b.Number < 0 {
		return errors.New("block number cannot be negative")
	}

	if b.Timestamp <= 0 {
		return errors.New("timestamp must be positive")
	}

	// Validate parent hashes
	for _, parent := range b.ParentHashes {
		if !hashRegex.MatchString(parent) {
			return errors.New("invalid parent hash format")
		}
	}

	return nil
}

// IsGenesis returns true if this is the genesis block
func (b *Block) IsGenesis() bool {
	return b.Number == 0
}

// ParentCount returns the number of parent blocks
func (b *Block) ParentCount() int {
	return len(b.ParentHashes)
}

