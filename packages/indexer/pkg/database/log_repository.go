package database

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// LogRepository implements LogReader and LogWriter interfaces
type LogRepository struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewLogRepository creates a new LogRepository
func NewLogRepository(conn *pgx.Conn, logger *zap.Logger) *LogRepository {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &LogRepository{
		conn:   conn,
		logger: logger,
	}
}

// SaveLog saves an event log to the database
func (r *LogRepository) SaveLog(ctx context.Context, log *domain.Log) error {
	query := `
		INSERT INTO event_logs (
			transaction_hash, log_index, block_hash, block_number,
			address, topics, data, timestamp
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8
		)
		ON CONFLICT (transaction_hash, log_index) DO NOTHING
	`

	// Extract event signature from first topic if available
	var eventSignature *string
	if len(log.Topics) > 0 {
		eventSignature = &log.Topics[0]
	}

	// Use block number as timestamp placeholder
	// In production, we'd get actual timestamp from block
	timestamp := log.BlockNumber

	_, err := r.conn.Exec(ctx, query,
		log.TransactionHash,
		log.LogIndex,
		log.BlockHash,
		log.BlockNumber,
		log.Address,
		log.Topics,
		string(log.Data),
		timestamp,
	)

	if err != nil {
		r.logger.Error("failed to save log",
			zap.String("transactionHash", log.TransactionHash),
			zap.Uint64("logIndex", log.LogIndex),
			zap.Error(err))
		return fmt.Errorf("save log: %w", err)
	}

	// Update event signature if we have it
	if eventSignature != nil {
		updateQuery := `
			UPDATE event_logs
			SET event_signature = $1
			WHERE transaction_hash = $2 AND log_index = $3
		`
		_, _ = r.conn.Exec(ctx, updateQuery, eventSignature, log.TransactionHash, log.LogIndex)
	}

	return nil
}

// GetLogsByTransactionHash retrieves all logs for a transaction
func (r *LogRepository) GetLogsByTransactionHash(ctx context.Context, txHash string) ([]*domain.Log, error) {
	query := `
		SELECT transaction_hash, log_index, address, topics, data,
		       block_number, block_hash, timestamp
		FROM event_logs
		WHERE transaction_hash = $1
		ORDER BY log_index ASC
	`

	rows, err := r.conn.Query(ctx, query, txHash)
	if err != nil {
		r.logger.Error("failed to get logs by transaction hash",
			zap.String("txHash", txHash),
			zap.Error(err))
		return nil, fmt.Errorf("get logs by transaction hash: %w", err)
	}
	defer rows.Close()

	var logs []*domain.Log
	for rows.Next() {
		var log domain.Log
		var topics []string
		var data string
		var timestamp int64

		err := rows.Scan(
			&log.TransactionHash,
			&log.LogIndex,
			&log.Address,
			&topics,
			&data,
			&log.BlockNumber,
			&log.BlockHash,
			&timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("scan log: %w", err)
		}

		log.Topics = topics
		log.Data = []byte(data)

		logs = append(logs, &log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return logs, nil
}

// GetLogsByAddress retrieves logs for an address within a block range
func (r *LogRepository) GetLogsByAddress(ctx context.Context, address string, fromBlock, toBlock int64) ([]*domain.Log, error) {
	query := `
		SELECT transaction_hash, log_index, address, topics, data,
		       block_number, block_hash, timestamp
		FROM event_logs
		WHERE address = $1
		  AND block_number >= $2
		  AND block_number <= $3
		ORDER BY block_number ASC, log_index ASC
	`

	rows, err := r.conn.Query(ctx, query, address, fromBlock, toBlock)
	if err != nil {
		r.logger.Error("failed to get logs by address",
			zap.String("address", address),
			zap.Int64("fromBlock", fromBlock),
			zap.Int64("toBlock", toBlock),
			zap.Error(err))
		return nil, fmt.Errorf("get logs by address: %w", err)
	}
	defer rows.Close()

	var logs []*domain.Log
	for rows.Next() {
		var log domain.Log
		var topics []string
		var data string
		var timestamp int64

		err := rows.Scan(
			&log.TransactionHash,
			&log.LogIndex,
			&log.Address,
			&topics,
			&data,
			&log.BlockNumber,
			&log.BlockHash,
			&timestamp,
		)
		if err != nil {
			return nil, fmt.Errorf("scan log: %w", err)
		}

		log.Topics = topics
		log.Data = []byte(data)

		logs = append(logs, &log)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return logs, nil
}

