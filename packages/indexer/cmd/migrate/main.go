package main

import (
	"context"
	"flag"
	"fmt"
	"os"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
)

func main() {
	var (
		dbURL    = flag.String("db", "postgresql://phoenix:phoenix_dev@localhost:5432/phoenix_explorer?sslmode=disable", "Database URL")
		rollback = flag.Bool("rollback", false, "Rollback last migration")
		version  = flag.Bool("version", false, "Show current migration version")
	)
	flag.Parse()

	logger, err := zap.NewDevelopment()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	ctx := context.Background()

	// Connect to database
	conn, err := pgx.Connect(ctx, *dbURL)
	if err != nil {
		logger.Fatal("Failed to connect to database", zap.Error(err))
	}
	defer conn.Close(ctx)

	migrator := database.NewMigrator(conn, logger)

	if *version {
		v, err := migrator.GetVersion(ctx)
		if err != nil {
			logger.Fatal("Failed to get version", zap.Error(err))
		}
		fmt.Printf("Current migration version: %s\n", v)
		return
	}

	if *rollback {
		if err := migrator.Rollback(ctx); err != nil {
			logger.Fatal("Failed to rollback migration", zap.Error(err))
		}
		logger.Info("Migration rolled back successfully")
		return
	}

	// Run migrations
	if err := migrator.Migrate(ctx); err != nil {
		logger.Fatal("Failed to run migrations", zap.Error(err))
	}

	logger.Info("Migrations completed successfully")
}

