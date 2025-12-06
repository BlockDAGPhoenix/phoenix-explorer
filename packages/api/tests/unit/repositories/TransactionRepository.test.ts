import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionRepository } from '@/repositories/TransactionRepository';
import { Pool } from 'pg';
import { Transaction } from '@/domain/Transaction';

// Mock pg Pool
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  
  return {
    Pool: vi.fn().mockImplementation(() => ({
      query: mockQuery,
      connect: vi.fn(),
      end: vi.fn(),
    })),
    mockQuery,
  };
});

describe('TransactionRepository', () => {
  let repository: TransactionRepository;
  let mockPool: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool();
    mockQuery = vi.fn();
    mockPool.query = mockQuery;
    repository = new TransactionRepository(mockPool);
  });

  describe('getTransactionByHash', () => {
    it('should return transaction when exists', async () => {
      const expectedTx: Transaction = {
        hash: '0x' + 'a'.repeat(64),
        blockHash: '0x' + 'b'.repeat(64),
        blockNumber: 1000n,
        transactionIndex: 0,
        from: '0x' + 'c'.repeat(40),
        to: '0x' + 'd'.repeat(40),
        value: 1000000000000000000n,
        gasLimit: 21000n,
        gasPrice: 20000000000n,
        gasUsed: 21000n,
        nonce: 5n,
        input: '0x',
        status: 1,
        createsContract: false,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          hash: expectedTx.hash,
          block_hash: expectedTx.blockHash,
          block_number: expectedTx.blockNumber.toString(),
          transaction_index: expectedTx.transactionIndex,
          from_address: expectedTx.from,
          to_address: expectedTx.to,
          value: expectedTx.value.toString(),
          gas_limit: expectedTx.gasLimit.toString(),
          gas_price: expectedTx.gasPrice?.toString(),
          gas_used: expectedTx.gasUsed?.toString(),
          nonce: expectedTx.nonce.toString(),
          input_data: expectedTx.input,
          status: expectedTx.status,
          creates_contract: expectedTx.createsContract,
          contract_address: null,
          timestamp: '1706150400000',
        }],
      });

      const result = await repository.getTransactionByHash(expectedTx.hash);

      expect(result).not.toBeNull();
      expect(result?.hash).toBe(expectedTx.hash);
      expect(result?.from).toBe(expectedTx.from);
    });

    it('should return null when transaction does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getTransactionByHash('0x' + 'z'.repeat(64));

      expect(result).toBeNull();
    });
  });

  describe('getTransactionsByBlockHash', () => {
    it('should return transactions for block', async () => {
      const blockHash = '0x' + 'b'.repeat(64);
      const expectedRows = [
        {
          hash: '0x' + 'a'.repeat(64),
          block_hash: blockHash,
          block_number: '1000',
          transaction_index: 0,
          from_address: '0x' + 'c'.repeat(40),
          to_address: '0x' + 'd'.repeat(40),
          value: '1000000000000000000',
          gas_limit: '21000',
          gas_price: null,
          gas_used: null,
          nonce: '5',
          input_data: '0x',
          status: 1,
          creates_contract: false,
          contract_address: null,
          timestamp: '1706150400000',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedRows });

      const result = await repository.getTransactionsByBlockHash(blockHash);

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe(expectedRows[0].hash);
    });
  });

  describe('getLatestTransactions', () => {
    it('should return latest transactions ordered by block number DESC', async () => {
      const expectedRows = [
        {
          hash: '0x' + 'a'.repeat(64),
          block_hash: '0x' + 'b'.repeat(64),
          block_number: '1002',
          transaction_index: 0,
          from_address: '0x' + 'c'.repeat(40),
          to_address: '0x' + 'd'.repeat(40),
          value: '1000000000000000000',
          gas_limit: '21000',
          gas_price: null,
          gas_used: null,
          nonce: '5',
          input_data: '0x',
          status: 1,
          creates_contract: false,
          contract_address: null,
          timestamp: '1706150402000',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedRows });

      const result = await repository.getLatestTransactions(10);

      expect(result).toHaveLength(1);
      expect(result[0].blockNumber).toBe(1002n);
    });
  });
});

