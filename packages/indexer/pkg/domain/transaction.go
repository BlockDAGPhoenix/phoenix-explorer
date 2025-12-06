package domain

import "errors"

// Transaction represents a transaction in the Phoenix network
type Transaction struct {
	Hash             string
	BlockHash        string
	BlockNumber      int64
	TransactionIndex int
	From             string
	To               *string // nil for contract creation
	Value            uint64
	GasLimit         uint64
	GasPrice         *uint64
	GasUsed          *uint64
	Nonce            uint64
	Input            []byte
	Status           *int // 0 = failed, 1 = success, nil = pending
	CreatesContract  bool
	ContractAddress  *string
}

// Validate validates the transaction structure
func (tx *Transaction) Validate() error {
	if !hashRegex.MatchString(tx.Hash) {
		return errors.New("invalid transaction hash format")
	}

	if !hashRegex.MatchString(tx.BlockHash) {
		return errors.New("invalid block hash format")
	}

	if !addressRegex.MatchString(tx.From) {
		return errors.New("invalid from address format")
	}

	if tx.To != nil && !addressRegex.MatchString(*tx.To) {
		return errors.New("invalid to address format")
	}

	if tx.BlockNumber < 0 {
		return errors.New("block number cannot be negative")
	}

	if int64(tx.Nonce) < 0 {
		return errors.New("nonce cannot be negative")
	}

	return nil
}

// IsContractCreation returns true if this transaction creates a contract
func (tx *Transaction) IsContractCreation() bool {
	return tx.To == nil
}

