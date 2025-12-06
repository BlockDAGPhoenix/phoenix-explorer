package domain

import "math/big"

// Address represents an address in the Phoenix network
type Address struct {
	Address         string
	Balance         *big.Int
	Nonce           uint64
	IsContract      bool
	ContractCode    []byte
	TransactionCount int64
}

// HasBalance returns true if address has a positive balance
func (a *Address) HasBalance() bool {
	return a.Balance != nil && a.Balance.Sign() > 0
}

// IsZero returns true if address is the zero address
func (a *Address) IsZero() bool {
	return a.Address == "0x0000000000000000000000000000000000000000"
}

