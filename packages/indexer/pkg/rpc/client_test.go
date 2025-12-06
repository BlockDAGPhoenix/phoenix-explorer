package rpc_test

import (
	"context"
	"encoding/json"
	"math/big"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/ethereum/go-ethereum/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/rpc"
)

func TestPhoenixClient_BlockNumber(t *testing.T) {
	// Create mock RPC server
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["method"] == "eth_blockNumber" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"jsonrpc": "2.0",
				"id":      1,
				"result":  "0x3e8", // 1000 in hex
			})
		}
	}))
	defer server.Close()

	// Create client
	client := rpc.NewPhoenixClient(server.URL)

	// Test
	blockNumber, err := client.BlockNumber(context.Background())
	require.NoError(t, err)
	assert.Equal(t, big.NewInt(1000), blockNumber)
}

func TestPhoenixClient_BlockNumber_RPCError(t *testing.T) {
	// Create mock RPC server that returns error
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	_, err := client.BlockNumber(context.Background())
	assert.Error(t, err)
}

func TestPhoenixClient_BlockNumber_InvalidResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      1,
			"error": map[string]interface{}{
				"code":    -32603,
				"message": "Internal error",
			},
		})
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	_, err := client.BlockNumber(context.Background())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "Internal error")
}

func TestPhoenixClient_GetBlockByNumber(t *testing.T) {
	mockBlock := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"result": map[string]interface{}{
			"hash":         "0x" + strings.Repeat("a", 64),
			"number":       "0x64", // 100 in hex
			"timestamp":    "0x65abc123",
			"parentHashes": []string{"0x" + strings.Repeat("b", 64)},
			"miner":        "0x" + strings.Repeat("c", 40),
			"gasLimit":     "0x1c9c380", // 30000000
			"gasUsed":      "0x5208",    // 21000
			"blueScore":    "0x64",      // 100
			"isChainBlock": true,
			"transactions": []interface{}{},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["method"] == "eth_getBlockByNumber" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockBlock)
		}
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	block, err := client.GetBlockByNumber(context.Background(), big.NewInt(100), false)
	require.NoError(t, err)
	assert.NotNil(t, block)
	assert.True(t, strings.HasPrefix(block.Hash, "0x"))
	assert.Equal(t, int64(100), block.Number)
	assert.Equal(t, 1, len(block.ParentHashes))
}

func TestPhoenixClient_GetBlockByHash(t *testing.T) {
	mockBlock := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"result": map[string]interface{}{
			"hash":         "0x" + strings.Repeat("d", 64),
			"number":       "0x65", // 101 in hex
			"timestamp":    "0x65abc456",
			"parentHashes": []string{"0x" + strings.Repeat("e", 64), "0x" + strings.Repeat("f", 64)},
			"miner":        "0x" + strings.Repeat("c", 40),
			"gasLimit":     "0x1c9c380",
			"gasUsed":      "0x5208",
			"blueScore":    "0x65",
			"isChainBlock": true,
			"transactions": []interface{}{},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["method"] == "eth_getBlockByHash" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockBlock)
		}
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	blockHash := common.HexToHash("0x" + strings.Repeat("d", 64))
	block, err := client.GetBlockByHash(context.Background(), blockHash, false)
	require.NoError(t, err)
	assert.NotNil(t, block)
	assert.True(t, strings.HasPrefix(block.Hash, "0x"))
	assert.Equal(t, int64(101), block.Number)
	assert.Equal(t, 2, len(block.ParentHashes))
}

func TestPhoenixClient_GetTransactionReceipt(t *testing.T) {
	mockReceipt := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"result": map[string]interface{}{
			"transactionHash": "0xtx123",
			"status":         "0x1", // 1 = success
			"gasUsed":        "0x5208", // 21000 in hex
			"logs":           []interface{}{},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["method"] == "eth_getTransactionReceipt" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockReceipt)
		}
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	txHash := common.HexToHash("0xtx123")
	receipt, err := client.GetTransactionReceipt(context.Background(), txHash)
	require.NoError(t, err)
	assert.NotNil(t, receipt)
	assert.Equal(t, "0xtx123", receipt.TransactionHash)
	assert.Equal(t, 1, receipt.Status)
	assert.Equal(t, uint64(21000), receipt.GasUsed)
}

func TestPhoenixClient_GetBlockParents(t *testing.T) {
	mockResponse := map[string]interface{}{
		"jsonrpc": "2.0",
		"id":      1,
		"result":  []string{"0xparent1", "0xparent2"},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		json.NewDecoder(r.Body).Decode(&req)

		if req["method"] == "phoenix_getBlockParents" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockResponse)
		}
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	blockHash := common.HexToHash("0xblock1")
	parents, err := client.GetBlockParents(context.Background(), blockHash)
	require.NoError(t, err)
	assert.Equal(t, 2, len(parents))
	assert.Equal(t, common.HexToHash("0xparent1"), parents[0])
	assert.Equal(t, common.HexToHash("0xparent2"), parents[1])
}

func TestPhoenixClient_RetryLogic(t *testing.T) {
	attempts := 0
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"jsonrpc": "2.0",
			"id":      1,
			"result":  "0x3e8",
		})
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL, rpc.WithMaxRetries(3))

	_, err := client.BlockNumber(context.Background())
	assert.NoError(t, err)
	assert.Equal(t, 3, attempts, "should retry 3 times")
}

func TestPhoenixClient_RetryExhausted(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusServiceUnavailable)
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL, rpc.WithMaxRetries(2))

	_, err := client.BlockNumber(context.Background())
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "max retries")
}

func TestPhoenixClient_ContextCancellation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Simulate slow response
		select {}
	}))
	defer server.Close()

	client := rpc.NewPhoenixClient(server.URL)

	ctx, cancel := context.WithCancel(context.Background())
	cancel() // Cancel immediately

	_, err := client.BlockNumber(ctx)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "context canceled")
}

