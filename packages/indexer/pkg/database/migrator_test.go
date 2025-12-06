package database_test

import (
	"context"
	"testing"

	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
)

const migratorTestDatabaseURL = "postgresql://phoenix:phoenix_dev@localhost:5433/phoenix_explorer_test?sslmode=disable"

func TestMigrator_Migrate(t *testing.T) {
	// Skip if database not available
	conn, err := pgx.Connect(context.Background(), migratorTestDatabaseURL)
	if err != nil {
		t.Skipf("Skipping test: database not available: %v", err)
		return
	}
	defer conn.Close(context.Background())

	ctx := context.Background()
	logger := zap.NewNop()

	// Clean up before test
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS schema_migrations CASCADE")
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS ghostdag_data CASCADE")
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS dag_relationships CASCADE")
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS transactions CASCADE")
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS addresses CASCADE")
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS blocks CASCADE")

	migrator := database.NewMigrator(conn, logger)

	// Run migrations
	err = migrator.Migrate(ctx)
	require.NoError(t, err)

	// Verify migrations table exists
	var migrationsTableExists bool
	err = conn.QueryRow(ctx,
		"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'schema_migrations')",
	).Scan(&migrationsTableExists)
	require.NoError(t, err)
	assert.True(t, migrationsTableExists, "schema_migrations table should exist")

	// Verify all tables were created
	tables := []string{"blocks", "transactions", "dag_relationships", "ghostdag_data", "addresses"}
	for _, tableName := range tables {
		var exists bool
		err = conn.QueryRow(ctx,
			"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = $1)",
			tableName,
		).Scan(&exists)
		require.NoError(t, err)
		assert.True(t, exists, "table %s should exist", tableName)
	}

	// Verify migration records
	var count int
	err = conn.QueryRow(ctx, "SELECT COUNT(*) FROM schema_migrations").Scan(&count)
	require.NoError(t, err)
	assert.Greater(t, count, 0, "should have migration records")
}

func TestMigrator_GetVersion(t *testing.T) {
	conn, err := pgx.Connect(context.Background(), migratorTestDatabaseURL)
	if err != nil {
		t.Skipf("Skipping test: database not available: %v", err)
		return
	}
	defer conn.Close(context.Background())

	ctx := context.Background()
	logger := zap.NewNop()

	// Clean up
	_, _ = conn.Exec(ctx, "DROP TABLE IF EXISTS schema_migrations CASCADE")

	// Create migrations table
	_, err = conn.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		)
	`)
	require.NoError(t, err)

	migrator := database.NewMigrator(conn, logger)

	// Get version when no migrations applied
	version, err := migrator.GetVersion(ctx)
	require.NoError(t, err)
	assert.Equal(t, "0", version)

	// Insert a test migration
	_, err = conn.Exec(ctx, `INSERT INTO schema_migrations (version) VALUES ($1)`, "001_test")
	require.NoError(t, err)

	// Get version
	version, err = migrator.GetVersion(ctx)
	require.NoError(t, err)
	assert.Equal(t, "001", version)
}

