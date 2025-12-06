package indexer

import (
	"context"
	"fmt"
	"math/big"

	"github.com/ethereum/go-ethereum/common"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

// DAGIndexerDeps contains dependencies for DAGIndexer (ISP)
type DAGIndexerDeps struct {
	ParentsRPC  interfaces.BlockParentsReader
	DAGInfoRPC  interfaces.DAGInfoReader
	BlueScoreRPC interfaces.BlueScoreReader
	DAGDB       interfaces.DAGWriter
	Logger      *zap.Logger
}

// DAGIndexer indexes DAG relationships and GHOSTDAG data
type DAGIndexer struct {
	parentsRPC  interfaces.BlockParentsReader
	dagInfoRPC  interfaces.DAGInfoReader
	blueScoreRPC interfaces.BlueScoreReader
	dagDB       interfaces.DAGWriter
	logger      *zap.Logger
}

// NewDAGIndexer creates a new DAGIndexer
func NewDAGIndexer(deps DAGIndexerDeps) *DAGIndexer {
	logger := deps.Logger
	if logger == nil {
		logger = zap.NewNop()
	}

	return &DAGIndexer{
		parentsRPC:  deps.ParentsRPC,
		dagInfoRPC:  deps.DAGInfoRPC,
		blueScoreRPC: deps.BlueScoreRPC,
		dagDB:       deps.DAGDB,
		logger:      logger,
	}
}

// IndexBlockDAGRelationships indexes DAG relationships for a block
// selectedParentHash is the hash of the selected parent (if known)
func (di *DAGIndexer) IndexBlockDAGRelationships(
	ctx context.Context,
	blockHash common.Hash,
	selectedParentHash string,
) error {
	// 1. Fetch parent hashes from RPC
	parents, err := di.parentsRPC.GetBlockParents(ctx, blockHash)
	if err != nil {
		di.logger.Error("failed to fetch parents",
			zap.String("blockHash", blockHash.Hex()),
			zap.Error(err))
		return fmt.Errorf("fetch parents: %w", err)
	}

	if len(parents) == 0 {
		di.logger.Debug("block has no parents (genesis)",
			zap.String("blockHash", blockHash.Hex()))
		return nil // Genesis block, no relationships to save
	}

	// 2. Save DAG relationships
	for _, parentHash := range parents {
		isSelectedParent := selectedParentHash != "" && parentHash.Hex() == selectedParentHash
		// If selectedParentHash not provided, first parent is assumed to be selected
		if selectedParentHash == "" && parentHash.Hex() == parents[0].Hex() {
			isSelectedParent = true
		}

		if err := di.dagDB.SaveDAGRelationship(
			ctx,
			blockHash.Hex(),
			parentHash.Hex(),
			isSelectedParent,
		); err != nil {
			di.logger.Error("failed to save DAG relationship",
				zap.String("blockHash", blockHash.Hex()),
				zap.String("parentHash", parentHash.Hex()),
				zap.Error(err))
			return fmt.Errorf("save DAG relationship: %w", err)
		}
	}

	di.logger.Debug("DAG relationships indexed",
		zap.String("blockHash", blockHash.Hex()),
		zap.Int("parentCount", len(parents)))

	return nil
}

// IndexGHOSTDAGData indexes GHOSTDAG data for a block
func (di *DAGIndexer) IndexGHOSTDAGData(
	ctx context.Context,
	blockHash common.Hash,
	blockNumber *big.Int,
) error {
	// 1. Fetch DAG info from RPC
	dagInfo, err := di.dagInfoRPC.GetDAGInfo(ctx)
	if err != nil {
		di.logger.Error("failed to fetch DAG info",
			zap.String("blockHash", blockHash.Hex()),
			zap.Error(err))
		return fmt.Errorf("fetch DAG info: %w", err)
	}

	// 2. Fetch blue score for the block
	blueScore, err := di.blueScoreRPC.GetBlueScore(ctx, blockNumber)
	if err != nil {
		di.logger.Error("failed to fetch blue score",
			zap.String("blockHash", blockHash.Hex()),
			zap.Error(err))
		return fmt.Errorf("fetch blue score: %w", err)
	}

	// 3. Convert to domain.GHOSTDAGData
	ghostDAGData := &domain.GHOSTDAGData{
		BlockHash:      blockHash.Hex(),
		BlueScore:      blueScore,
		BlueWork:       dagInfo.BlueWork,
		MergeSetBlues:  dagInfo.MergeSetBlues,
		MergeSetReds:   dagInfo.MergeSetReds,
		// SelectedParent will be set when indexing relationships
	}

	// 4. Save to database
	if err := di.dagDB.SaveGHOSTDAGData(ctx, blockHash.Hex(), ghostDAGData); err != nil {
		di.logger.Error("failed to save GHOSTDAG data",
			zap.String("blockHash", blockHash.Hex()),
			zap.Error(err))
		return fmt.Errorf("save GHOSTDAG data: %w", err)
	}

	di.logger.Debug("GHOSTDAG data indexed",
		zap.String("blockHash", blockHash.Hex()),
		zap.Uint64("blueScore", blueScore))

	return nil
}

