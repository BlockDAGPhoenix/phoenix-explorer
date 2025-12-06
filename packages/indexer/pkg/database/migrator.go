package database

import (
	"context"
	"embed"
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5"
	"go.uber.org/zap"
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// Migrator handles database migrations
type Migrator struct {
	conn   *pgx.Conn
	logger *zap.Logger
}

// NewMigrator creates a new migrator instance
func NewMigrator(conn *pgx.Conn, logger *zap.Logger) *Migrator {
	return &Migrator{
		conn:   conn,
		logger: logger,
	}
}

// Migrate runs all pending migrations
func (m *Migrator) Migrate(ctx context.Context) error {
	// Create migrations table if it doesn't exist
	if err := m.createMigrationsTable(ctx); err != nil {
		return fmt.Errorf("create migrations table: %w", err)
	}

	// Get applied migrations
	applied, err := m.getAppliedMigrations(ctx)
	if err != nil {
		return fmt.Errorf("get applied migrations: %w", err)
	}

	// Get all migration files
	migrations, err := m.getMigrationFiles()
	if err != nil {
		return fmt.Errorf("get migration files: %w", err)
	}

	// Apply pending migrations
	for _, migration := range migrations {
		if applied[migration.Name] {
			m.logger.Debug("migration already applied", zap.String("name", migration.Name))
			continue
		}

		if err := m.applyMigration(ctx, migration); err != nil {
			return fmt.Errorf("apply migration %s: %w", migration.Name, err)
		}

		m.logger.Info("migration applied", zap.String("name", migration.Name))
	}

	return nil
}

type migrationFile struct {
	Name string
	Path string
	Up   string
	Down string
}

func (m *Migrator) getMigrationFiles() ([]migrationFile, error) {
	var migrations []migrationFile
	migrationMap := make(map[string]*migrationFile)

	// Read all files from migrations directory
	err := fs.WalkDir(migrationsFS, "migrations", func(path string, d fs.DirEntry, err error) error {
		if err != nil {
			return err
		}

		if d.IsDir() {
			return nil
		}

		// Parse migration file name: 001_name.up.sql or 001_name.down.sql
		baseName := filepath.Base(path)
		parts := strings.Split(baseName, "_")
		if len(parts) < 3 {
			return nil // Skip non-migration files
		}

		number := parts[0]
		direction := strings.Split(parts[len(parts)-1], ".")[0] // "up" or "down"

		// Extract migration name (without number and direction)
		nameParts := parts[1 : len(parts)-1]
		name := strings.Join(nameParts, "_")

		key := number + "_" + name

		migration, exists := migrationMap[key]
		if !exists {
			migration = &migrationFile{
				Name: key,
			}
			migrationMap[key] = migration
		}

		// Read file content
		content, err := migrationsFS.ReadFile(path)
		if err != nil {
			return fmt.Errorf("read migration file %s: %w", path, err)
		}

		if direction == "up" {
			migration.Up = string(content)
			migration.Path = path
		} else if direction == "down" {
			migration.Down = string(content)
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Convert map to slice and sort
	for _, migration := range migrationMap {
		migrations = append(migrations, *migration)
	}

	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Name < migrations[j].Name
	})

	return migrations, nil
}

func (m *Migrator) createMigrationsTable(ctx context.Context) error {
	query := `
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version VARCHAR(255) PRIMARY KEY,
			applied_at TIMESTAMP DEFAULT NOW()
		);
	`

	_, err := m.conn.Exec(ctx, query)
	return err
}

func (m *Migrator) getAppliedMigrations(ctx context.Context) (map[string]bool, error) {
	query := `SELECT version FROM schema_migrations`
	rows, err := m.conn.Query(ctx, query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var version string
		if err := rows.Scan(&version); err != nil {
			return nil, err
		}
		applied[version] = true
	}

	return applied, rows.Err()
}

func (m *Migrator) applyMigration(ctx context.Context, migration migrationFile) error {
	// Begin transaction
	tx, err := m.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Execute migration
	if _, err := tx.Exec(ctx, migration.Up); err != nil {
		return fmt.Errorf("execute migration: %w", err)
	}

	// Record migration
	if _, err := tx.Exec(ctx,
		`INSERT INTO schema_migrations (version) VALUES ($1)`,
		migration.Name,
	); err != nil {
		return fmt.Errorf("record migration: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}

// Rollback rolls back the last migration
func (m *Migrator) Rollback(ctx context.Context) error {
	// Get last applied migration
	var lastMigration string
	err := m.conn.QueryRow(ctx,
		`SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1`,
	).Scan(&lastMigration)
	if err != nil {
		if err == pgx.ErrNoRows {
			return fmt.Errorf("no migrations to rollback")
		}
		return fmt.Errorf("get last migration: %w", err)
	}

	// Get migration files
	migrations, err := m.getMigrationFiles()
	if err != nil {
		return fmt.Errorf("get migration files: %w", err)
	}

	// Find the migration to rollback
	var migration *migrationFile
	for i := range migrations {
		if migrations[i].Name == lastMigration {
			migration = &migrations[i]
			break
		}
	}

	if migration == nil || migration.Down == "" {
		return fmt.Errorf("migration %s not found or no rollback script", lastMigration)
	}

	// Begin transaction
	tx, err := m.conn.Begin(ctx)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Execute rollback
	if _, err := tx.Exec(ctx, migration.Down); err != nil {
		return fmt.Errorf("execute rollback: %w", err)
	}

	// Remove migration record
	if _, err := tx.Exec(ctx,
		`DELETE FROM schema_migrations WHERE version = $1`,
		lastMigration,
	); err != nil {
		return fmt.Errorf("remove migration record: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("commit transaction: %w", err)
	}

	m.logger.Info("migration rolled back", zap.String("name", lastMigration))

	return nil
}

// GetVersion returns the current migration version
func (m *Migrator) GetVersion(ctx context.Context) (string, error) {
	var version string
	err := m.conn.QueryRow(ctx,
		`SELECT version FROM schema_migrations ORDER BY applied_at DESC LIMIT 1`,
	).Scan(&version)
	if err != nil {
		if err == pgx.ErrNoRows {
			return "0", nil
		}
		return "", err
	}

	// Extract number from version (e.g., "001_create_blocks_table" -> "001")
	parts := strings.Split(version, "_")
	if len(parts) > 0 {
		if _, err := strconv.Atoi(parts[0]); err == nil {
			return parts[0], nil
		}
	}

	return version, nil
}

