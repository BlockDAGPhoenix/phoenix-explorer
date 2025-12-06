// Package main provides the entry point for the Phoenix Explorer Indexer
package main

import (
	"context"
	"fmt"
	"math/big"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"

	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/indexer"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/rpc"
)

func main() {
	// Initialize logger
	logger, err := zap.NewProduction()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	logger.Info("Starting Phoenix Explorer Indexer")

	// Get configuration from environment
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		dbURL = "postgresql://phoenix:phoenix_dev@localhost:5432/phoenix_explorer?sslmode=disable"
	}

	rpcURL := os.Getenv("PHOENIX_RPC_URL")
	if rpcURL == "" {
		rpcURL = "http://localhost:8545"
	}

	batchSize := 10
	if bs := os.Getenv("INDEXER_BATCH_SIZE"); bs != "" {
		if parsed, err := strconv.Atoi(bs); err == nil {
			batchSize = parsed
		}
	}

	logger.Info("Configuration loaded",
		zap.String("database_url", dbURL),
		zap.String("rpc_url", rpcURL),
		zap.Int("batch_size", batchSize),
	)

	// Create context with cancellation
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle shutdown signals
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		sig := <-sigChan
		logger.Info("Received shutdown signal", zap.String("signal", sig.String()))
		cancel()
	}()

	// Connect to database
	logger.Info("Connecting to database...")
	conn, err := pgx.Connect(ctx, dbURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer conn.Close(ctx)

	// Verify database connection
	if err := conn.Ping(ctx); err != nil {
		logger.Fatal("Failed to ping database", zap.Error(err))
	}
	logger.Info("Connected to database")

	// Create RPC client
	logger.Info("Connecting to Phoenix Node RPC...")
	rpcClient := rpc.NewPhoenixClient(rpcURL, rpc.WithLogger(logger))

	// Verify RPC connection
	blockNum, err := rpcClient.BlockNumber(ctx)
	if err != nil {
		logger.Fatal("Failed to connect to Phoenix Node RPC", zap.Error(err))
	}
	logger.Info("Connected to Phoenix Node RPC", zap.String("current_block", blockNum.String()))

	// Create repositories
	blockRepo := database.NewBlockRepository(conn, logger)
	txRepo := database.NewTransactionRepository(conn, logger)

	// Create block indexer
	blockIndexer := indexer.NewBlockIndexer(indexer.BlockIndexerDeps{
		RPC:    rpcClient,
		DB:     blockRepo,
		TxDB:   txRepo,
		Logger: logger,
	})

	// Start indexing loop
	logger.Info("Starting indexer loop")

	// Track last indexed block
	var lastIndexedBlock int64 = -1

	ticker := time.NewTicker(2 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			logger.Info("Shutting down indexer")
			return
		case <-ticker.C:
			// Get current block number
			currentBlock, err := rpcClient.BlockNumber(ctx)
			if err != nil {
				logger.Error("Failed to get current block number", zap.Error(err))
				continue
			}

			currentBlockNum := currentBlock.Int64()

			// Index new blocks
			if currentBlockNum > lastIndexedBlock {
				startBlock := lastIndexedBlock + 1
				if startBlock < 0 {
					startBlock = 0
				}

				endBlock := currentBlockNum
				if endBlock-startBlock > int64(batchSize) {
					endBlock = startBlock + int64(batchSize)
				}

				for blockNum := startBlock; blockNum <= endBlock; blockNum++ {
					blockBigInt := big.NewInt(blockNum)

				// Index block
				if err := blockIndexer.IndexBlock(ctx, blockBigInt); err != nil {
					logger.Error("Failed to index block",
						zap.Int64("block", blockNum),
						zap.Error(err),
					)
					continue
				}

				lastIndexedBlock = blockNum
				logger.Info("Indexed block",
					zap.Int64("block", blockNum),
					zap.Int64("current", currentBlockNum),
				)
				}
			}
		}
	}
}

