package database_test

import (
	"context"
	"database/sql"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

const testDatabaseURL = "postgresql://phoenix:phoenix_dev@localhost:5433/phoenix_explorer_test?sslmode=disable"

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("pgx", testDatabaseURL)
	require.NoError(t, err)

	// Clean up before test
	cleanupTestDB(t, db)

	return db
}

func cleanupTestDB(t *testing.T, db *sql.DB) {
	// Drop tables in reverse order of creation
	tables := []string{
		"ghostdag_data",
		"dag_relationships",
		"transactions",
		"addresses",
		"blocks",
	}

	for _, table := range tables {
		_, _ = db.Exec("DROP TABLE IF EXISTS " + table + " CASCADE")
	}
}

func teardownTestDB(t *testing.T, db *sql.DB) {
	cleanupTestDB(t, db)
	db.Close()
}

func TestMigrations_CreateBlocksTable(t *testing.T) {
	db := setupTestDB(t)
	defer teardownTestDB(t, db)

	ctx := context.Background()

	// Read and execute migration
	migrationSQL := `
	CREATE TABLE IF NOT EXISTS blocks (
		id BIGSERIAL PRIMARY KEY,
		hash VARCHAR(66) NOT NULL UNIQUE,
		number BIGINT NOT NULL,
		parent_hashes TEXT[] NOT NULL DEFAULT '{}',
		timestamp BIGINT NOT NULL,
		gas_limit BIGINT NOT NULL DEFAULT 0,
		gas_used BIGINT NOT NULL DEFAULT 0,
		blue_score BIGINT NOT NULL DEFAULT 0,
		is_chain_block BOOLEAN DEFAULT true,
		transaction_count INTEGER DEFAULT 0,
		created_at TIMESTAMP DEFAULT NOW(),
		CONSTRAINT chk_hash_format CHECK (hash ~ '^0x[0-9a-f]{64}$'),
		CONSTRAINT chk_positive_number CHECK (number >= 0),
		CONSTRAINT chk_positive_blue_score CHECK (blue_score >= 0)
	);
	`

	_, err := db.ExecContext(ctx, migrationSQL)
	require.NoError(t, err)

	// Test table exists
	var exists bool
	err = db.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'blocks')",
	).Scan(&exists)
	require.NoError(t, err)
	assert.True(t, exists, "blocks table should exist")

	// Test indexes exist
	indexes := []string{
		"idx_blocks_number",
		"idx_blocks_blue_score",
		"idx_blocks_timestamp",
	}

	for _, indexName := range indexes {
		var indexExists bool
		err = db.QueryRowContext(ctx,
			"SELECT EXISTS (SELECT FROM pg_indexes WHERE indexname = $1)",
			indexName,
		).Scan(&indexExists)
		require.NoError(t, err)
		assert.True(t, indexExists, "index %s should exist", indexName)
	}

	// Test constraints work
	_, err = db.ExecContext(ctx,
		`INSERT INTO blocks (hash, number, timestamp) VALUES ($1, $2, $3)`,
		"0x"+string(make([]byte, 64)), // Invalid hash format
		100,
		1706150400000,
	)
	assert.Error(t, err, "should reject invalid hash format")

	// Test valid insert
	validHash := "0x" + string(make([]byte, 64))
	for i := range validHash[2:] {
		validHash = validHash[:2+i] + "a" + validHash[2+i+1:]
	}
	_, err = db.ExecContext(ctx,
		`INSERT INTO blocks (hash, number, timestamp) VALUES ($1, $2, $3)`,
		validHash,
		100,
		1706150400000,
	)
	assert.NoError(t, err, "should accept valid block")
}

func TestMigrations_CreateTransactionsTable(t *testing.T) {
	db := setupTestDB(t)
	defer teardownTestDB(t, db)

	ctx := context.Background()

	// First create blocks table (dependency)
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS blocks (
			id BIGSERIAL PRIMARY KEY,
			hash VARCHAR(66) NOT NULL UNIQUE,
			number BIGINT NOT NULL,
			timestamp BIGINT NOT NULL,
			gas_limit BIGINT NOT NULL DEFAULT 0,
			gas_used BIGINT NOT NULL DEFAULT 0,
			blue_score BIGINT NOT NULL DEFAULT 0,
			created_at TIMESTAMP DEFAULT NOW()
		);
	`)
	require.NoError(t, err)

	// Create a test block
	testBlockHash := "0x" + string(make([]byte, 64))
	for i := range testBlockHash[2:] {
		testBlockHash = testBlockHash[:2+i] + "a" + testBlockHash[2+i+1:]
	}
	_, err = db.ExecContext(ctx,
		`INSERT INTO blocks (hash, number, timestamp) VALUES ($1, $2, $3)`,
		testBlockHash, 100, 1706150400000,
	)
	require.NoError(t, err)

	// Create transactions table
	migrationSQL := `
	CREATE TABLE IF NOT EXISTS transactions (
		id BIGSERIAL PRIMARY KEY,
		hash VARCHAR(66) NOT NULL UNIQUE,
		block_hash VARCHAR(66) NOT NULL,
		block_number BIGINT NOT NULL,
		transaction_index INTEGER NOT NULL,
		from_address VARCHAR(42) NOT NULL,
		to_address VARCHAR(42),
		value NUMERIC(78, 0) NOT NULL DEFAULT 0,
		nonce BIGINT NOT NULL DEFAULT 0,
		gas_limit BIGINT NOT NULL DEFAULT 0,
		timestamp BIGINT NOT NULL,
		created_at TIMESTAMP DEFAULT NOW(),
		CONSTRAINT fk_transactions_block FOREIGN KEY (block_hash) 
			REFERENCES blocks(hash) ON DELETE CASCADE,
		CONSTRAINT chk_tx_hash_format CHECK (hash ~ '^0x[0-9a-f]{64}$')
	);
	`

	_, err = db.ExecContext(ctx, migrationSQL)
	require.NoError(t, err)

	// Test table exists
	var exists bool
	err = db.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'transactions')",
	).Scan(&exists)
	require.NoError(t, err)
	assert.True(t, exists, "transactions table should exist")

	// Test foreign key constraint
	testTxHash := "0x" + string(make([]byte, 64))
	for i := range testTxHash[2:] {
		testTxHash = testTxHash[:2+i] + "b" + testTxHash[2+i+1:]
	}
	testFromAddr := "0x" + string(make([]byte, 40))
	for i := range testFromAddr[2:] {
		testFromAddr = testFromAddr[:2+i] + "c" + testFromAddr[2+i+1:]
	}

	_, err = db.ExecContext(ctx,
		`INSERT INTO transactions (hash, block_hash, block_number, transaction_index, from_address, timestamp) 
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		testTxHash, testBlockHash, 100, 0, testFromAddr, 1706150400000,
	)
	assert.NoError(t, err, "should accept valid transaction")

	// Test foreign key constraint works
	_, err = db.ExecContext(ctx,
		`INSERT INTO transactions (hash, block_hash, block_number, transaction_index, from_address, timestamp) 
		 VALUES ($1, $2, $3, $4, $5, $6)`,
		"0x"+string(make([]byte, 64)), "0xinvalid", 100, 0, testFromAddr, 1706150400000,
	)
	assert.Error(t, err, "should reject transaction with invalid block_hash")
}

func TestMigrations_CreateDAGRelationshipsTable(t *testing.T) {
	db := setupTestDB(t)
	defer teardownTestDB(t, db)

	ctx := context.Background()

	// Create blocks table first
	_, err := db.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS blocks (
			hash VARCHAR(66) PRIMARY KEY,
			number BIGINT NOT NULL,
			timestamp BIGINT NOT NULL,
			blue_score BIGINT NOT NULL DEFAULT 0
		);
	`)
	require.NoError(t, err)

	// Create test blocks
	parentHash := "0x" + string(make([]byte, 64))
	childHash := "0x" + string(make([]byte, 64))
	for i := range parentHash[2:] {
		parentHash = parentHash[:2+i] + "a" + parentHash[2+i+1:]
		childHash = childHash[:2+i] + "b" + childHash[2+i+1:]
	}

	_, err = db.ExecContext(ctx,
		`INSERT INTO blocks (hash, number, timestamp) VALUES ($1, $2, $3), ($4, $5, $6)`,
		parentHash, 100, 1706150400000,
		childHash, 101, 1706150401000,
	)
	require.NoError(t, err)

	// Create DAG relationships table
	migrationSQL := `
	CREATE TABLE IF NOT EXISTS dag_relationships (
		child_hash VARCHAR(66) NOT NULL,
		parent_hash VARCHAR(66) NOT NULL,
		is_selected_parent BOOLEAN DEFAULT false,
		created_at TIMESTAMP DEFAULT NOW(),
		PRIMARY KEY (child_hash, parent_hash),
		CONSTRAINT fk_dag_child FOREIGN KEY (child_hash) 
			REFERENCES blocks(hash) ON DELETE CASCADE,
		CONSTRAINT fk_dag_parent FOREIGN KEY (parent_hash) 
			REFERENCES blocks(hash) ON DELETE CASCADE
	);
	`

	_, err = db.ExecContext(ctx, migrationSQL)
	require.NoError(t, err)

	// Test table exists
	var exists bool
	err = db.QueryRowContext(ctx,
		"SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'dag_relationships')",
	).Scan(&exists)
	require.NoError(t, err)
	assert.True(t, exists, "dag_relationships table should exist")

	// Test insert relationship
	_, err = db.ExecContext(ctx,
		`INSERT INTO dag_relationships (child_hash, parent_hash, is_selected_parent) 
		 VALUES ($1, $2, $3)`,
		childHash, parentHash, true,
	)
	assert.NoError(t, err, "should accept valid DAG relationship")

	// Test cascade delete
	_, err = db.ExecContext(ctx, `DELETE FROM blocks WHERE hash = $1`, parentHash)
	require.NoError(t, err)

	var count int
	err = db.QueryRowContext(ctx,
		"SELECT COUNT(*) FROM dag_relationships WHERE parent_hash = $1",
		parentHash,
	).Scan(&count)
	require.NoError(t, err)
	assert.Equal(t, 0, count, "relationship should be deleted on cascade")
}

