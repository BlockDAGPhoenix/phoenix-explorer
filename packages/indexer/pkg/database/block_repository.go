package database

import (
	"context"
	"fmt"
	"strings"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// BlockRepository implements BlockReader and BlockWriter interfaces
type BlockRepository struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewBlockRepository creates a new BlockRepository
func NewBlockRepository(conn *pgx.Conn, logger *zap.Logger) *BlockRepository {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &BlockRepository{
		conn:   conn,
		logger: logger,
	}
}

// SaveBlock saves a block to the database
func (r *BlockRepository) SaveBlock(ctx context.Context, block *domain.Block) error {
	query := `
		INSERT INTO blocks (
			hash, number, parent_hashes, timestamp, miner_address,
			gas_limit, gas_used, base_fee_per_gas, blue_score,
			is_chain_block, selected_parent_hash, transactions_root,
			state_root, receipts_root, transaction_count
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15
		)
		ON CONFLICT (hash) DO UPDATE SET
			gas_used = EXCLUDED.gas_used,
			blue_score = EXCLUDED.blue_score,
			indexed_at = NOW()
	`

	var baseFee *string
	if block.BaseFeePerGas != nil {
		baseFeeStr := fmt.Sprintf("%d", *block.BaseFeePerGas)
		baseFee = &baseFeeStr
	}

	var selectedParent *string
	if block.SelectedParent != "" {
		selectedParent = &block.SelectedParent
	}

	var transactionsRoot *string
	if block.TransactionsRoot != "" {
		transactionsRoot = &block.TransactionsRoot
	}

	var stateRoot *string
	if block.StateRoot != "" {
		stateRoot = &block.StateRoot
	}

	var receiptsRoot *string
	if block.ReceiptsRoot != "" {
		receiptsRoot = &block.ReceiptsRoot
	}

	_, err := r.conn.Exec(ctx, query,
		block.Hash,
		block.Number,
		block.ParentHashes,
		block.Timestamp,
		block.Miner,
		block.GasLimit,
		block.GasUsed,
		baseFee,
		block.BlueScore,
		block.IsChainBlock,
		selectedParent,
		transactionsRoot,
		stateRoot,
		receiptsRoot,
		len(block.Transactions),
	)

	if err != nil {
		r.logger.Error("failed to save block",
			zap.String("hash", block.Hash),
			zap.Error(err))
		return fmt.Errorf("save block: %w", err)
	}

	return nil
}

// GetBlockByHash retrieves a block by its hash
func (r *BlockRepository) GetBlockByHash(ctx context.Context, hash string) (*domain.Block, error) {
	query := `
		SELECT hash, number, parent_hashes, timestamp, miner_address,
		       gas_limit, gas_used, base_fee_per_gas, blue_score,
		       is_chain_block, selected_parent_hash, transactions_root,
		       state_root, receipts_root, transaction_count
		FROM blocks
		WHERE hash = $1
	`

	var block domain.Block
	var baseFee *string
	var selectedParent *string
	var transactionsRoot *string
	var stateRoot *string
	var receiptsRoot *string

	var txCount int
	err := r.conn.QueryRow(ctx, query, hash).Scan(
		&block.Hash,
		&block.Number,
		&block.ParentHashes,
		&block.Timestamp,
		&block.Miner,
		&block.GasLimit,
		&block.GasUsed,
		&baseFee,
		&block.BlueScore,
		&block.IsChainBlock,
		&selectedParent,
		&transactionsRoot,
		&stateRoot,
		&receiptsRoot,
		&txCount,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("block not found: %s", hash)
	}
	if err != nil {
		r.logger.Error("failed to get block by hash",
			zap.String("hash", hash),
			zap.Error(err))
		return nil, fmt.Errorf("get block by hash: %w", err)
	}

	// Parse optional fields
	if baseFee != nil {
		var val uint64
		fmt.Sscanf(*baseFee, "%d", &val)
		block.BaseFeePerGas = &val
	}

	if selectedParent != nil {
		block.SelectedParent = *selectedParent
	}

	if transactionsRoot != nil {
		block.TransactionsRoot = *transactionsRoot
	}

	if stateRoot != nil {
		block.StateRoot = *stateRoot
	}

	if receiptsRoot != nil {
		block.ReceiptsRoot = *receiptsRoot
	}

	return &block, nil
}

// GetBlockByNumber retrieves a block by its number
func (r *BlockRepository) GetBlockByNumber(ctx context.Context, number int64) (*domain.Block, error) {
	query := `
		SELECT hash, number, parent_hashes, timestamp, miner_address,
		       gas_limit, gas_used, base_fee_per_gas, blue_score,
		       is_chain_block, selected_parent_hash, transactions_root,
		       state_root, receipts_root, transaction_count
		FROM blocks
		WHERE number = $1
		ORDER BY blue_score DESC
		LIMIT 1
	`

	var block domain.Block
	var baseFee *string
	var selectedParent *string
	var transactionsRoot *string
	var stateRoot *string
	var receiptsRoot *string

	var txCount int
	err := r.conn.QueryRow(ctx, query, number).Scan(
		&block.Hash,
		&block.Number,
		&block.ParentHashes,
		&block.Timestamp,
		&block.Miner,
		&block.GasLimit,
		&block.GasUsed,
		&baseFee,
		&block.BlueScore,
		&block.IsChainBlock,
		&selectedParent,
		&transactionsRoot,
		&stateRoot,
		&receiptsRoot,
		&txCount,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("block not found: number %d", number)
	}
	if err != nil {
		r.logger.Error("failed to get block by number",
			zap.Int64("number", number),
			zap.Error(err))
		return nil, fmt.Errorf("get block by number: %w", err)
	}

	// Parse optional fields
	if baseFee != nil {
		var val uint64
		fmt.Sscanf(*baseFee, "%d", &val)
		block.BaseFeePerGas = &val
	}

	if selectedParent != nil {
		block.SelectedParent = *selectedParent
	}

	if transactionsRoot != nil {
		block.TransactionsRoot = *transactionsRoot
	}

	if stateRoot != nil {
		block.StateRoot = *stateRoot
	}

	if receiptsRoot != nil {
		block.ReceiptsRoot = *receiptsRoot
	}

	return &block, nil
}

// GetLatestBlocks retrieves the latest N blocks ordered by number DESC
func (r *BlockRepository) GetLatestBlocks(ctx context.Context, limit int) ([]*domain.Block, error) {
	query := `
		SELECT hash, number, parent_hashes, timestamp, miner_address,
		       gas_limit, gas_used, base_fee_per_gas, blue_score,
		       is_chain_block, selected_parent_hash, transactions_root,
		       state_root, receipts_root, transaction_count
		FROM blocks
		ORDER BY number DESC, blue_score DESC
		LIMIT $1
	`

	rows, err := r.conn.Query(ctx, query, limit)
	if err != nil {
		r.logger.Error("failed to get latest blocks",
			zap.Int("limit", limit),
			zap.Error(err))
		return nil, fmt.Errorf("get latest blocks: %w", err)
	}
	defer rows.Close()

	var blocks []*domain.Block
	for rows.Next() {
		var block domain.Block
		var baseFee *string
		var selectedParent *string
		var transactionsRoot *string
		var stateRoot *string
		var receiptsRoot *string
		var txCount int

		err := rows.Scan(
			&block.Hash,
			&block.Number,
			&block.ParentHashes,
			&block.Timestamp,
			&block.Miner,
			&block.GasLimit,
			&block.GasUsed,
			&baseFee,
			&block.BlueScore,
			&block.IsChainBlock,
			&selectedParent,
			&transactionsRoot,
			&stateRoot,
			&receiptsRoot,
			&txCount,
		)
		if err != nil {
			return nil, fmt.Errorf("scan block: %w", err)
		}

		// Parse optional fields
		if baseFee != nil {
			var val uint64
			fmt.Sscanf(*baseFee, "%d", &val)
			block.BaseFeePerGas = &val
		}

		if selectedParent != nil {
			block.SelectedParent = *selectedParent
		}

		if transactionsRoot != nil {
			block.TransactionsRoot = *transactionsRoot
		}

		if stateRoot != nil {
			block.StateRoot = *stateRoot
		}

		if receiptsRoot != nil {
			block.ReceiptsRoot = *receiptsRoot
		}

		blocks = append(blocks, &block)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return blocks, nil
}

// UpdateBlock updates block fields
func (r *BlockRepository) UpdateBlock(ctx context.Context, hash string, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}

	setParts := []string{}
	args := []interface{}{}
	argIndex := 1

	for field, value := range updates {
		setParts = append(setParts, fmt.Sprintf("%s = $%d", field, argIndex))
		args = append(args, value)
		argIndex++
	}

	// Add indexed_at update (use NOW() function directly in SQL)
	setParts = append(setParts, "indexed_at = NOW()")

	// Add WHERE clause
	args = append(args, hash)

	query := fmt.Sprintf(`
		UPDATE blocks
		SET %s
		WHERE hash = $%d
	`, strings.Join(setParts, ", "), argIndex)

	_, err := r.conn.Exec(ctx, query, args...)
	if err != nil {
		r.logger.Error("failed to update block",
			zap.String("hash", hash),
			zap.Error(err))
		return fmt.Errorf("update block: %w", err)
	}

	return nil
}

