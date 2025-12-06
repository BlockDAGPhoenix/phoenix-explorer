package database_test

import (
	"context"
	"math/big"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/database"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/domain"
)

func TestAddressRepository_SaveAddress(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	address := &domain.Address{
		Address:        "0x" + strings.Repeat("a", 40),
		Balance:        big.NewInt(1000000000000000000), // 1 ETH
		Nonce:          5,
		IsContract:     false,
		TransactionCount: 10,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Verify address was saved
	saved, err := repo.GetAddress(ctx, address.Address)
	require.NoError(t, err)
	assert.Equal(t, address.Address, saved.Address)
	assert.Equal(t, address.Balance.String(), saved.Balance.String())
	assert.Equal(t, address.Nonce, saved.Nonce)
}

func TestAddressRepository_GetAddress(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	address := &domain.Address{
		Address:        "0x" + strings.Repeat("a", 40),
		Balance:        big.NewInt(1000000000000000000),
		Nonce:          5,
		IsContract:     false,
		TransactionCount: 10,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Retrieve address
	saved, err := repo.GetAddress(ctx, address.Address)
	require.NoError(t, err)
	assert.Equal(t, address.Address, saved.Address)
	assert.Equal(t, address.Balance.String(), saved.Balance.String())

	// Test non-existent address
	_, err = repo.GetAddress(ctx, "0x"+strings.Repeat("z", 40))
	assert.Error(t, err)
}

func TestAddressRepository_GetAddressBalance(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	address := &domain.Address{
		Address:        "0x" + strings.Repeat("a", 40),
		Balance:        big.NewInt(1000000000000000000),
		Nonce:          5,
		IsContract:     false,
		TransactionCount: 10,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Get balance
	balance, err := repo.GetAddressBalance(ctx, address.Address)
	require.NoError(t, err)
	assert.Equal(t, address.Balance.String(), balance.String())
}

func TestAddressRepository_UpdateAddressBalance(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	address := &domain.Address{
		Address:        "0x" + strings.Repeat("a", 40),
		Balance:        big.NewInt(1000000000000000000),
		Nonce:          5,
		IsContract:     false,
		TransactionCount: 10,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Update balance
	newBalance := big.NewInt(2000000000000000000) // 2 ETH
	err = repo.UpdateAddressBalance(ctx, address.Address, newBalance)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetAddress(ctx, address.Address)
	require.NoError(t, err)
	assert.Equal(t, newBalance.String(), updated.Balance.String())
}

func TestAddressRepository_UpdateAddressNonce(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	address := &domain.Address{
		Address:        "0x" + strings.Repeat("a", 40),
		Balance:        big.NewInt(1000000000000000000),
		Nonce:          5,
		IsContract:     false,
		TransactionCount: 10,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Update nonce
	err = repo.UpdateAddressNonce(ctx, address.Address, 10)
	require.NoError(t, err)

	// Verify update
	updated, err := repo.GetAddress(ctx, address.Address)
	require.NoError(t, err)
	assert.Equal(t, uint64(10), updated.Nonce)
}

func TestAddressRepository_ContractAddress(t *testing.T) {
	conn, cleanup := setupBlockRepoTestDB(t)
	if conn == nil {
		return
	}
	defer cleanup()

	ctx := context.Background()
	repo := database.NewAddressRepository(conn, zap.NewNop())

	// Contract address
	address := &domain.Address{
		Address:        "0x" + strings.Repeat("b", 40),
		Balance:        big.NewInt(0),
		Nonce:          0,
		IsContract:     true,
		ContractCode:   []byte{0x60, 0x60, 0x60}, // Contract bytecode
		TransactionCount: 0,
	}

	err := repo.SaveAddress(ctx, address)
	require.NoError(t, err)

	// Verify contract
	saved, err := repo.GetAddress(ctx, address.Address)
	require.NoError(t, err)
	assert.True(t, saved.IsContract)
	assert.NotNil(t, saved.ContractCode)
}

