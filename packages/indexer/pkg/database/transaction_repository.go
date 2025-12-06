package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// TransactionRepository implements TransactionReader and TransactionWriter interfaces
type TransactionRepository struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewTransactionRepository creates a new TransactionRepository
func NewTransactionRepository(conn *pgx.Conn, logger *zap.Logger) *TransactionRepository {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &TransactionRepository{
		conn:   conn,
		logger: logger,
	}
}

// SaveTransaction saves a transaction to the database
func (r *TransactionRepository) SaveTransaction(ctx context.Context, tx *domain.Transaction) error {
	query := `
		INSERT INTO transactions (
			hash, block_hash, block_number, transaction_index,
			from_address, to_address, value, input_data, nonce,
			gas_limit, gas_price, gas_used, status,
			creates_contract, contract_address, timestamp
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
		)
		ON CONFLICT (hash) DO UPDATE SET
			gas_used = EXCLUDED.gas_used,
			status = EXCLUDED.status
	`

	var toAddress *string = tx.To
	var gasPrice *string
	if tx.GasPrice != nil {
		gasPriceStr := fmt.Sprintf("%d", *tx.GasPrice)
		gasPrice = &gasPriceStr
	}

	var gasUsed *int64
	if tx.GasUsed != nil {
		gasUsedVal := int64(*tx.GasUsed)
		gasUsed = &gasUsedVal
	}

	var status *int16
	if tx.Status != nil {
		statusVal := int16(*tx.Status)
		status = &statusVal
	}

	var contractAddress *string = tx.ContractAddress

	// Get timestamp from block (we'll need to query it)
	// For now, use block number as placeholder - in production, fetch from block
	timestamp := tx.BlockNumber

	_, err := r.conn.Exec(ctx, query,
		tx.Hash,
		tx.BlockHash,
		tx.BlockNumber,
		tx.TransactionIndex,
		tx.From,
		toAddress,
		fmt.Sprintf("%d", tx.Value),
		string(tx.Input),
		tx.Nonce,
		tx.GasLimit,
		gasPrice,
		gasUsed,
		status,
		tx.CreatesContract,
		contractAddress,
		timestamp,
	)

	if err != nil {
		r.logger.Error("failed to save transaction",
			zap.String("hash", tx.Hash),
			zap.Error(err))
		return fmt.Errorf("save transaction: %w", err)
	}

	return nil
}

// GetTransactionByHash retrieves a transaction by its hash
func (r *TransactionRepository) GetTransactionByHash(ctx context.Context, hash string) (*domain.Transaction, error) {
	query := `
		SELECT hash, block_hash, block_number, transaction_index,
		       from_address, to_address, value, input_data, nonce,
		       gas_limit, gas_price, gas_used, status,
		       creates_contract, contract_address, timestamp
		FROM transactions
		WHERE hash = $1
	`

	var tx domain.Transaction
	var toAddress *string
	var gasPrice *string
	var gasUsed *int64
	var status *int16
	var contractAddress *string
	var inputData string
	var timestamp int64

	err := r.conn.QueryRow(ctx, query, hash).Scan(
		&tx.Hash,
		&tx.BlockHash,
		&tx.BlockNumber,
		&tx.TransactionIndex,
		&tx.From,
		&toAddress,
		&tx.Value,
		&inputData,
		&tx.Nonce,
		&tx.GasLimit,
		&gasPrice,
		&gasUsed,
		&status,
		&tx.CreatesContract,
		&contractAddress,
		&timestamp,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("transaction not found: %s", hash)
	}
	if err != nil {
		r.logger.Error("failed to get transaction by hash",
			zap.String("hash", hash),
			zap.Error(err))
		return nil, fmt.Errorf("get transaction by hash: %w", err)
	}

	// Parse optional fields
	tx.To = toAddress
	tx.Input = []byte(inputData)

	if gasPrice != nil {
		var val uint64
		fmt.Sscanf(*gasPrice, "%d", &val)
		tx.GasPrice = &val
	}

	if gasUsed != nil {
		val := uint64(*gasUsed)
		tx.GasUsed = &val
	}

	if status != nil {
		val := int(*status)
		tx.Status = &val
	}

	tx.ContractAddress = contractAddress

	return &tx, nil
}

// GetTransactionsByBlockHash retrieves all transactions for a block
func (r *TransactionRepository) GetTransactionsByBlockHash(ctx context.Context, blockHash string) ([]*domain.Transaction, error) {
	query := `
		SELECT hash, block_hash, block_number, transaction_index,
		       from_address, to_address, value, input_data, nonce,
		       gas_limit, gas_price, gas_used, status,
		       creates_contract, contract_address, timestamp
		FROM transactions
		WHERE block_hash = $1
		ORDER BY transaction_index ASC
	`

	rows, err := r.conn.Query(ctx, query, blockHash)
	if err != nil {
		r.logger.Error("failed to get transactions by block hash",
			zap.String("blockHash", blockHash),
			zap.Error(err))
		return nil, fmt.Errorf("get transactions by block hash: %w", err)
	}
	defer rows.Close()

	var transactions []*domain.Transaction
	for rows.Next() {
		var tx domain.Transaction
		var toAddress *string
		var gasPrice *string
		var gasUsed *int64
		var status *int16
		var contractAddress *string
		var inputData string
		var timestamp int64

		err := rows.Scan(
			&tx.Hash,
			&tx.BlockHash,
			&tx.BlockNumber,
			&tx.TransactionIndex,
			&tx.From,
			&toAddress,
			&tx.Value,
			&inputData,
			&tx.Nonce,
			&tx.GasLimit,
			&gasPrice,
			&gasUsed,
			&status,
			&tx.CreatesContract,
			&contractAddress,
			&timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("scan transaction: %w", err)
		}

		// Parse optional fields
		tx.To = toAddress
		tx.Input = []byte(inputData)

		if gasPrice != nil {
			var val uint64
			fmt.Sscanf(*gasPrice, "%d", &val)
			tx.GasPrice = &val
		}

		if gasUsed != nil {
			val := uint64(*gasUsed)
			tx.GasUsed = &val
		}

		if status != nil {
			val := int(*status)
			tx.Status = &val
		}

		tx.ContractAddress = contractAddress

		transactions = append(transactions, &tx)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return transactions, nil
}

// UpdateTransactionStatus updates transaction status and gas used
func (r *TransactionRepository) UpdateTransactionStatus(ctx context.Context, hash string, status int, gasUsed uint64) error {
	query := `
		UPDATE transactions
		SET status = $1, gas_used = $2
		WHERE hash = $3
	`

	statusVal := int16(status)
	gasUsedVal := int64(gasUsed)

	_, err := r.conn.Exec(ctx, query, statusVal, gasUsedVal, hash)
	if err != nil {
		r.logger.Error("failed to update transaction status",
			zap.String("hash", hash),
			zap.Error(err))
		return fmt.Errorf("update transaction status: %w", err)
	}

	return nil
}

