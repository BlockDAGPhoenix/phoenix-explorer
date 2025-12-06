package rpc

import (
	"math/big"

	"github.com/ethereum/go-ethereum/common/hexutil"
	"github.com/BlockDAGPhoenix/phoenix-explorer/indexer/pkg/interfaces"
)

// rpcBlock represents a block from Phoenix RPC
type rpcBlock struct {
	Hash             string   `json:"hash"`
	Number           string   `json:"number"`
	ParentHashes     []string `json:"parentHashes"`
	Timestamp        string   `json:"timestamp"`
	Miner            string   `json:"miner"`
	GasLimit         string   `json:"gasLimit"`
	GasUsed          string   `json:"gasUsed"`
	BaseFeePerGas    *string  `json:"baseFeePerGas"`
	BlueScore        string   `json:"blueScore"`
	IsChainBlock     bool     `json:"isChainBlock"`
	SelectedParent   string   `json:"selectedParent"`
	TransactionsRoot string   `json:"transactionsRoot"`
	StateRoot        string   `json:"stateRoot"`
	ReceiptsRoot     string   `json:"receiptsRoot"`
	Transactions     []interface{} `json:"transactions"`
}

// toBlock converts rpcBlock to interfaces.Block
func (rb *rpcBlock) toBlock() (*interfaces.Block, error) {
	number, err := hexutil.DecodeBig(rb.Number)
	if err != nil {
		return nil, err
	}

	timestamp, err := hexutil.DecodeBig(rb.Timestamp)
	if err != nil {
		return nil, err
	}

	gasLimit, err := hexutil.DecodeUint64(rb.GasLimit)
	if err != nil {
		return nil, err
	}

	gasUsed, err := hexutil.DecodeUint64(rb.GasUsed)
	if err != nil {
		return nil, err
	}

	var baseFeePerGas *uint64
	if rb.BaseFeePerGas != nil {
		bf, err := hexutil.DecodeUint64(*rb.BaseFeePerGas)
		if err != nil {
			return nil, err
		}
		baseFeePerGas = &bf
	}

	blueScore, err := hexutil.DecodeUint64(rb.BlueScore)
	if err != nil {
		return nil, err
	}

	// Parse transactions
	transactions := make([]interfaces.Transaction, 0, len(rb.Transactions))
	for _, txData := range rb.Transactions {
		txMap, ok := txData.(map[string]interface{})
		if !ok {
			continue
		}

		tx, err := parseTransaction(txMap)
		if err != nil {
			continue // Skip invalid transactions
		}
		transactions = append(transactions, *tx)
	}

	return &interfaces.Block{
		Hash:           rb.Hash,
		Number:         number.Int64(),
		ParentHashes:   rb.ParentHashes,
		Timestamp:      timestamp.Int64(),
		Miner:          rb.Miner,
		GasLimit:       gasLimit,
		GasUsed:        gasUsed,
		BaseFeePerGas:  baseFeePerGas,
		BlueScore:      blueScore,
		IsChainBlock:   rb.IsChainBlock,
		SelectedParent: rb.SelectedParent,
		Transactions:   transactions,
	}, nil
}

// rpcReceipt represents a transaction receipt from Phoenix RPC
type rpcReceipt struct {
	TransactionHash string        `json:"transactionHash"`
	Status          string        `json:"status"`
	GasUsed         string        `json:"gasUsed"`
	Logs            []interface{} `json:"logs"`
}

// toReceipt converts rpcReceipt to interfaces.Receipt
func (rr *rpcReceipt) toReceipt() (*interfaces.Receipt, error) {
	status, err := hexutil.DecodeUint64(rr.Status)
	if err != nil {
		return nil, err
	}

	gasUsed, err := hexutil.DecodeUint64(rr.GasUsed)
	if err != nil {
		return nil, err
	}

	logs := make([]interfaces.Log, 0, len(rr.Logs))
	for _, logData := range rr.Logs {
		logMap, ok := logData.(map[string]interface{})
		if !ok {
			continue
		}

		log, err := parseLog(logMap)
		if err != nil {
			continue
		}
		logs = append(logs, *log)
	}

	return &interfaces.Receipt{
		TransactionHash: rr.TransactionHash,
		Status:          int(status),
		GasUsed:         gasUsed,
		Logs:            logs,
	}, nil
}

func parseTransaction(txMap map[string]interface{}) (*interfaces.Transaction, error) {
	hash, _ := txMap["hash"].(string)
	from, _ := txMap["from"].(string)
	toStr, _ := txMap["to"].(string)
	var to *string
	if toStr != "" {
		to = &toStr
	}

	valueStr, _ := txMap["value"].(string)
	value := big.NewInt(0)
	if valueStr != "" {
		var err error
		value, err = hexutil.DecodeBig(valueStr)
		if err != nil {
			return nil, err
		}
	}

	gasStr, _ := txMap["gas"].(string)
	gas, err := hexutil.DecodeUint64(gasStr)
	if err != nil {
		return nil, err
	}

	gasPriceStr, _ := txMap["gasPrice"].(string)
	var gasPrice *big.Int
	if gasPriceStr != "" {
		gasPrice, err = hexutil.DecodeBig(gasPriceStr)
		if err != nil {
			return nil, err
		}
	}

	nonceStr, _ := txMap["nonce"].(string)
	nonce, err := hexutil.DecodeUint64(nonceStr)
	if err != nil {
		return nil, err
	}

	inputStr, _ := txMap["input"].(string)
	input, err := hexutil.Decode(inputStr)
	if err != nil {
		input = []byte{}
	}

	return &interfaces.Transaction{
		Hash:     hash,
		From:     from,
		To:       to,
		Value:    value,
		Gas:      gas,
		GasPrice: gasPrice,
		Nonce:    nonce,
		Input:    input,
	}, nil
}

func parseLog(logMap map[string]interface{}) (*interfaces.Log, error) {
	address, _ := logMap["address"].(string)

	topicsData, _ := logMap["topics"].([]interface{})
	topics := make([]string, 0, len(topicsData))
	for _, topic := range topicsData {
		if topicStr, ok := topic.(string); ok {
			topics = append(topics, topicStr)
		}
	}

	dataStr, _ := logMap["data"].(string)
	data, err := hexutil.Decode(dataStr)
	if err != nil {
		data = []byte{}
	}

	return &interfaces.Log{
		Address: address,
		Topics:  topics,
		Data:    data,
	}, nil
}

