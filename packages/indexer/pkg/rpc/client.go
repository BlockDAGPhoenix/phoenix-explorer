package rpc

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"math/big"
	"net/http"
	"time"

	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/common/hexutil"
	"go.uber.org/zap"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

// PhoenixClient implements Phoenix RPC client
type PhoenixClient struct {
	httpClient *http.Client
	rpcURL     string
	maxRetries int
	retryDelay time.Duration
	logger     *zap.Logger
}

// ClientOption configures PhoenixClient
type ClientOption func(*PhoenixClient)

// WithMaxRetries sets the maximum number of retries
func WithMaxRetries(max int) ClientOption {
	return func(c *PhoenixClient) {
		c.maxRetries = max
	}
}

// WithRetryDelay sets the delay between retries
func WithRetryDelay(delay time.Duration) ClientOption {
	return func(c *PhoenixClient) {
		c.retryDelay = delay
	}
}

// WithLogger sets the logger
func WithLogger(logger *zap.Logger) ClientOption {
	return func(c *PhoenixClient) {
		c.logger = logger
	}
}

// NewPhoenixClient creates a new Phoenix RPC client
func NewPhoenixClient(rpcURL string, opts ...ClientOption) *PhoenixClient {
	logger := zap.NewNop()

	client := &PhoenixClient{
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
		rpcURL:     rpcURL,
		maxRetries: 3,
		retryDelay: time.Second,
		logger:     logger,
	}

	for _, opt := range opts {
		opt(client)
	}

	return client
}

// BlockNumber implements interfaces.BlockNumberReader
func (c *PhoenixClient) BlockNumber(ctx context.Context) (*big.Int, error) {
	var result string
	err := c.callRPC(ctx, "eth_blockNumber", []interface{}{}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_blockNumber: %w", err)
	}

	blockNumber := new(big.Int)
	blockNumber.SetString(result[2:], 16) // Remove "0x" prefix

	return blockNumber, nil
}

// GetBlockByNumber implements interfaces.BlockByNumberReader
func (c *PhoenixClient) GetBlockByNumber(
	ctx context.Context,
	number *big.Int,
	fullTx bool,
) (*interfaces.Block, error) {
	var result *rpcBlock
	err := c.callRPC(ctx, "eth_getBlockByNumber",
		[]interface{}{fmt.Sprintf("0x%x", number), fullTx}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_getBlockByNumber: %w", err)
	}

	if result == nil {
		return nil, nil // Block not found
	}

	return result.toBlock()
}

// GetBlockByHash implements interfaces.BlockByHashReader
func (c *PhoenixClient) GetBlockByHash(
	ctx context.Context,
	hash common.Hash,
	fullTx bool,
) (*interfaces.Block, error) {
	var result *rpcBlock
	err := c.callRPC(ctx, "eth_getBlockByHash",
		[]interface{}{hash.Hex(), fullTx}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_getBlockByHash: %w", err)
	}

	if result == nil {
		return nil, nil // Block not found
	}

	return result.toBlock()
}

// GetTransactionReceipt implements interfaces.ReceiptReader
func (c *PhoenixClient) GetTransactionReceipt(
	ctx context.Context,
	hash common.Hash,
) (*interfaces.Receipt, error) {
	var result *rpcReceipt
	err := c.callRPC(ctx, "eth_getTransactionReceipt",
		[]interface{}{hash.Hex()}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_getTransactionReceipt: %w", err)
	}

	if result == nil {
		return nil, nil // Receipt not found
	}

	return result.toReceipt()
}

// GetLogs implements interfaces.LogReader
func (c *PhoenixClient) GetLogs(
	ctx context.Context,
	filter interfaces.FilterQuery,
) ([]interfaces.Log, error) {
	var result []interfaces.Log

	params := make(map[string]interface{})
	if filter.FromBlock != nil {
		params["fromBlock"] = fmt.Sprintf("0x%x", filter.FromBlock)
	}
	if filter.ToBlock != nil {
		params["toBlock"] = fmt.Sprintf("0x%x", filter.ToBlock)
	}
	if len(filter.Addresses) > 0 {
		addrs := make([]string, len(filter.Addresses))
		for i, addr := range filter.Addresses {
			addrs[i] = addr.Hex()
		}
		params["address"] = addrs
	}

	err := c.callRPC(ctx, "eth_getLogs", []interface{}{params}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_getLogs: %w", err)
	}

	return result, nil
}

// GetCode implements interfaces.CodeReader
func (c *PhoenixClient) GetCode(
	ctx context.Context,
	address common.Address,
) ([]byte, error) {
	var result string
	err := c.callRPC(ctx, "eth_getCode",
		[]interface{}{address.Hex(), "latest"}, &result)
	if err != nil {
		return nil, fmt.Errorf("eth_getCode: %w", err)
	}

	return hexutil.Decode(result)
}

// GetDAGInfo implements interfaces.DAGInfoReader
func (c *PhoenixClient) GetDAGInfo(ctx context.Context) (*interfaces.DAGInfo, error) {
	var result *interfaces.DAGInfo
	err := c.callRPC(ctx, "phoenix_getDAGInfo", []interface{}{}, &result)
	if err != nil {
		return nil, fmt.Errorf("phoenix_getDAGInfo: %w", err)
	}

	return result, nil
}

// GetBlueScore implements interfaces.BlueScoreReader
func (c *PhoenixClient) GetBlueScore(
	ctx context.Context,
	blockNumber *big.Int,
) (uint64, error) {
	var result string
	blockTag := "latest"
	if blockNumber != nil {
		blockTag = fmt.Sprintf("0x%x", blockNumber)
	}

	err := c.callRPC(ctx, "phoenix_getBlueScore", []interface{}{blockTag}, &result)
	if err != nil {
		return 0, fmt.Errorf("phoenix_getBlueScore: %w", err)
	}

	blueScore := new(big.Int)
	blueScore.SetString(result[2:], 16) // Remove "0x" prefix

	return blueScore.Uint64(), nil
}

// GetBlockParents implements interfaces.BlockParentsReader
func (c *PhoenixClient) GetBlockParents(
	ctx context.Context,
	hash common.Hash,
) ([]common.Hash, error) {
	var result []string
	err := c.callRPC(ctx, "phoenix_getBlockParents",
		[]interface{}{hash.Hex()}, &result)
	if err != nil {
		return nil, fmt.Errorf("phoenix_getBlockParents: %w", err)
	}

	parents := make([]common.Hash, len(result))
	for i, p := range result {
		parents[i] = common.HexToHash(p)
	}

	return parents, nil
}

// callRPC performs an RPC call with retry logic
func (c *PhoenixClient) callRPC(
	ctx context.Context,
	method string,
	params []interface{},
	result interface{},
) error {
	request := map[string]interface{}{
		"jsonrpc": "2.0",
		"method":  method,
		"params":  params,
		"id":      1,
	}

	reqBody, err := json.Marshal(request)
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	var lastErr error
	for attempt := 0; attempt <= c.maxRetries; attempt++ {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		if attempt > 0 {
			// Exponential backoff
			backoff := c.retryDelay * time.Duration(1<<uint(attempt-1))
			select {
			case <-ctx.Done():
				return ctx.Err()
			case <-time.After(backoff):
			}
		}

		req, err := http.NewRequestWithContext(ctx, "POST", c.rpcURL,
			bytes.NewReader(reqBody))
		if err != nil {
			return fmt.Errorf("create request: %w", err)
		}

		req.Header.Set("Content-Type", "application/json")

		resp, err := c.httpClient.Do(req)
		if err != nil {
			lastErr = err
			c.logger.Debug("RPC call failed, retrying",
				zap.String("method", method),
				zap.Int("attempt", attempt+1),
				zap.Error(err))
			continue
		}

		body, err := io.ReadAll(resp.Body)
		resp.Body.Close()

		if err != nil {
			lastErr = err
			continue
		}

		if resp.StatusCode != http.StatusOK {
			lastErr = fmt.Errorf("HTTP error: status %d", resp.StatusCode)
			continue
		}

		var rpcResp struct {
			Result json.RawMessage `json:"result"`
			Error  *struct {
				Code    int    `json:"code"`
				Message string `json:"message"`
			} `json:"error"`
		}

		if err := json.Unmarshal(body, &rpcResp); err != nil {
			return fmt.Errorf("unmarshal response: %w", err)
		}

		if rpcResp.Error != nil {
			return fmt.Errorf("RPC error %d: %s",
				rpcResp.Error.Code, rpcResp.Error.Message)
		}

		// Handle null result
		if string(rpcResp.Result) == "null" {
			return nil // Caller should check for nil result
		}

		if err := json.Unmarshal(rpcResp.Result, result); err != nil {
			return fmt.Errorf("unmarshal result: %w", err)
		}

		return nil
	}

	return fmt.Errorf("max retries (%d) exceeded: %w", c.maxRetries, lastErr)
}

