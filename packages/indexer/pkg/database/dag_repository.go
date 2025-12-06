package database

import (
	"context"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

// DAGRepository implements DAGReader and DAGWriter interfaces
type DAGRepository struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewDAGRepository creates a new DAGRepository
func NewDAGRepository(conn *pgx.Conn, logger *zap.Logger) *DAGRepository {
	if logger == nil {
		logger = zap.NewNop()
	}
	return &DAGRepository{
		conn:   conn,
		logger: logger,
	}
}

// SaveDAGRelationship saves a DAG parent-child relationship
func (r *DAGRepository) SaveDAGRelationship(ctx context.Context, childHash, parentHash string, isSelectedParent bool) error {
	query := `
		INSERT INTO dag_relationships (
			child_hash, parent_hash, is_selected_parent
		) VALUES (
			$1, $2, $3
		)
		ON CONFLICT (child_hash, parent_hash) DO UPDATE SET
			is_selected_parent = EXCLUDED.is_selected_parent
	`

	_, err := r.conn.Exec(ctx, query, childHash, parentHash, isSelectedParent)
	if err != nil {
		r.logger.Error("failed to save DAG relationship",
			zap.String("childHash", childHash),
			zap.String("parentHash", parentHash),
			zap.Error(err))
		return fmt.Errorf("save DAG relationship: %w", err)
	}

	return nil
}

// GetBlockParents retrieves all parent hashes for a block
func (r *DAGRepository) GetBlockParents(ctx context.Context, blockHash string) ([]string, error) {
	query := `
		SELECT parent_hash
		FROM dag_relationships
		WHERE child_hash = $1
		ORDER BY is_selected_parent DESC, parent_hash ASC
	`

	rows, err := r.conn.Query(ctx, query, blockHash)
	if err != nil {
		r.logger.Error("failed to get block parents",
			zap.String("blockHash", blockHash),
			zap.Error(err))
		return nil, fmt.Errorf("get block parents: %w", err)
	}
	defer rows.Close()

	var parents []string
	for rows.Next() {
		var parentHash string
		if err := rows.Scan(&parentHash); err != nil {
			return nil, fmt.Errorf("scan parent hash: %w", err)
		}
		parents = append(parents, parentHash)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return parents, nil
}

// GetBlockChildren retrieves all child hashes for a block
func (r *DAGRepository) GetBlockChildren(ctx context.Context, blockHash string) ([]string, error) {
	query := `
		SELECT child_hash
		FROM dag_relationships
		WHERE parent_hash = $1
		ORDER BY child_hash ASC
	`

	rows, err := r.conn.Query(ctx, query, blockHash)
	if err != nil {
		r.logger.Error("failed to get block children",
			zap.String("blockHash", blockHash),
			zap.Error(err))
		return nil, fmt.Errorf("get block children: %w", err)
	}
	defer rows.Close()

	var children []string
	for rows.Next() {
		var childHash string
		if err := rows.Scan(&childHash); err != nil {
			return nil, fmt.Errorf("scan child hash: %w", err)
		}
		children = append(children, childHash)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("rows error: %w", err)
	}

	return children, nil
}

// SaveGHOSTDAGData saves GHOSTDAG data for a block
func (r *DAGRepository) SaveGHOSTDAGData(ctx context.Context, blockHash string, data *domain.GHOSTDAGData) error {
	query := `
		INSERT INTO ghostdag_data (
			block_hash, blue_score, blue_work, selected_parent,
			merge_set_blues, merge_set_reds
		) VALUES (
			$1, $2, $3, $4, $5, $6
		)
		ON CONFLICT (block_hash) DO UPDATE SET
			blue_score = EXCLUDED.blue_score,
			blue_work = EXCLUDED.blue_work,
			selected_parent = EXCLUDED.selected_parent,
			merge_set_blues = EXCLUDED.merge_set_blues,
			merge_set_reds = EXCLUDED.merge_set_reds
	`

	var selectedParent *string
	if data.SelectedParent != "" {
		selectedParent = &data.SelectedParent
	}

	blueWorkStr := data.BlueWork.String()

	_, err := r.conn.Exec(ctx, query,
		blockHash,
		data.BlueScore,
		blueWorkStr,
		selectedParent,
		data.MergeSetBlues,
		data.MergeSetReds,
	)

	if err != nil {
		r.logger.Error("failed to save GHOSTDAG data",
			zap.String("blockHash", blockHash),
			zap.Error(err))
		return fmt.Errorf("save GHOSTDAG data: %w", err)
	}

	return nil
}

// GetGHOSTDAGData retrieves GHOSTDAG data for a block
func (r *DAGRepository) GetGHOSTDAGData(ctx context.Context, blockHash string) (*domain.GHOSTDAGData, error) {
	query := `
		SELECT block_hash, blue_score, blue_work, selected_parent,
		       merge_set_blues, merge_set_reds
		FROM ghostdag_data
		WHERE block_hash = $1
	`

	var data domain.GHOSTDAGData
	var selectedParent *string
	var blueWorkStr string

	err := r.conn.QueryRow(ctx, query, blockHash).Scan(
		&data.BlockHash,
		&data.BlueScore,
		&blueWorkStr,
		&selectedParent,
		&data.MergeSetBlues,
		&data.MergeSetReds,
	)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("GHOSTDAG data not found: %s", blockHash)
	}
	if err != nil {
		r.logger.Error("failed to get GHOSTDAG data",
			zap.String("blockHash", blockHash),
			zap.Error(err))
		return nil, fmt.Errorf("get GHOSTDAG data: %w", err)
	}

	// Parse blue work
	blueWork, ok := new(big.Int).SetString(blueWorkStr, 10)
	if !ok {
		return nil, fmt.Errorf("invalid blue work format: %s", blueWorkStr)
	}
	data.BlueWork = blueWork

	if selectedParent != nil {
		data.SelectedParent = *selectedParent
	}

	return &data, nil
}

