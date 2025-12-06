package database

import (
	"context"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// AddressRepository implements AddressReader and AddressWriter interfaces
type AddressRepository struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewAddressRepository creates a new AddressRepository
func NewAddressRepository(conn *pgx.Conn, logger *zap.Logger) *AddressRepository {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &AddressRepository{
		conn:   conn,
		logger: logger,
	}
}

// SaveAddress saves an address to the database
func (r *AddressRepository) SaveAddress(ctx context.Context, address *domain.Address) error {
	query := `
		INSERT INTO addresses (
			address, balance, nonce, is_contract, contract_code,
			transaction_count
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
		ON CONFLICT (address) DO UPDATE SET
			balance = EXCLUDED.balance,
			nonce = EXCLUDED.nonce,
			is_contract = EXCLUDED.is_contract,
			contract_code = EXCLUDED.contract_code,
			transaction_count = EXCLUDED.transaction_count,
			updated_at = NOW()
	`

	var contractCode *string
	if len(address.ContractCode) > 0 {
		codeStr := fmt.Sprintf("%x", address.ContractCode)
		contractCode = &codeStr
	}

	balanceStr := address.Balance.String()

	_, err := r.conn.Exec(ctx, query,
		address.Address,
		balanceStr,
		address.Nonce,
		address.IsContract,
		contractCode,
		address.TransactionCount,
	)

	if err != nil {
		r.logger.Error("failed to save address",
			zap.String("address", address.Address),
			zap.Error(err))
		return fmt.Errorf("save address: %w", err)
	}

	return nil
}

// GetAddress retrieves an address by its address string
func (r *AddressRepository) GetAddress(ctx context.Context, address string) (*domain.Address, error) {
	query := `
		SELECT address, balance, nonce, is_contract, contract_code,
		       transaction_count
		FROM addresses
		WHERE address = $1
	`

	var addr domain.Address
	var balanceStr string
	var contractCode *string
	var txCount int64

	err := r.conn.QueryRow(ctx, query, address).Scan(
		&addr.Address,
		&balanceStr,
		&addr.Nonce,
		&addr.IsContract,
		&contractCode,
		&txCount,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("address not found: %s", address)
	}
	if err != nil {
		r.logger.Error("failed to get address",
			zap.String("address", address),
			zap.Error(err))
		return nil, fmt.Errorf("get address: %w", err)
	}

	// Parse balance
	balance, ok := new(big.Int).SetString(balanceStr, 10)
	if !ok {
		return nil, fmt.Errorf("invalid balance format: %s", balanceStr)
	}
	addr.Balance = balance

	// Parse contract code
	if contractCode != nil && *contractCode != "" {
		// Convert hex string to bytes
		// In production, we'd use proper hex decoding
		addr.ContractCode = []byte(*contractCode)
	}

	addr.TransactionCount = txCount

	return &addr, nil
}

// GetAddressBalance retrieves the balance for an address
func (r *AddressRepository) GetAddressBalance(ctx context.Context, address string) (*big.Int, error) {
	query := `
		SELECT balance
		FROM addresses
		WHERE address = $1
	`

	var balanceStr string
	err := r.conn.QueryRow(ctx, query, address).Scan(&balanceStr)

	if err == pgx.ErrNoRows {
		// Return zero balance for non-existent address
		return big.NewInt(0), nil
	}
	if err != nil {
		r.logger.Error("failed to get address balance",
			zap.String("address", address),
			zap.Error(err))
		return nil, fmt.Errorf("get address balance: %w", err)
	}

	balance, ok := new(big.Int).SetString(balanceStr, 10)
	if !ok {
		return nil, fmt.Errorf("invalid balance format: %s", balanceStr)
	}

	return balance, nil
}

// UpdateAddressBalance updates the balance for an address
func (r *AddressRepository) UpdateAddressBalance(ctx context.Context, address string, balance *big.Int) error {
	query := `
		UPDATE addresses
		SET balance = $1, updated_at = NOW()
		WHERE address = $2
	`

	balanceStr := balance.String()

	result, err := r.conn.Exec(ctx, query, balanceStr, address)
	if err != nil {
		r.logger.Error("failed to update address balance",
			zap.String("address", address),
			zap.Error(err))
		return fmt.Errorf("update address balance: %w", err)
	}

	if result.RowsAffected() == 0 {
		// Address doesn't exist, create it
		addr := &domain.Address{
			Address:        address,
			Balance:        balance,
			Nonce:          0,
			IsContract:     false,
			TransactionCount: 0,
		}
		return r.SaveAddress(ctx, addr)
	}

	return nil
}

// UpdateAddressNonce updates the nonce for an address
func (r *AddressRepository) UpdateAddressNonce(ctx context.Context, address string, nonce uint64) error {
	query := `
		UPDATE addresses
		SET nonce = $1, updated_at = NOW()
		WHERE address = $2
	`

	result, err := r.conn.Exec(ctx, query, nonce, address)
	if err != nil {
		r.logger.Error("failed to update address nonce",
			zap.String("address", address),
			zap.Error(err))
		return fmt.Errorf("update address nonce: %w", err)
	}

	if result.RowsAffected() == 0 {
		// Address doesn't exist, create it
		addr := &domain.Address{
			Address:        address,
			Balance:        big.NewInt(0),
			Nonce:          nonce,
			IsContract:     false,
			TransactionCount: 0,
		}
		return r.SaveAddress(ctx, addr)
	}

	return nil
}

