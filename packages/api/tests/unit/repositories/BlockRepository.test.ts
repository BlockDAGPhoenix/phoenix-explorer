import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockRepository } from '@/repositories/BlockRepository';
import { Pool } from 'pg';
import { Block } from '@/domain/Block';

// Mock pg Pool
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  const mockQueryRow = vi.fn();
  
  return {
    Pool: vi.fn().mockImplementation(() => ({
      query: mockQuery,
      connect: vi.fn(),
      end: vi.fn(),
    })),
    mockQuery,
    mockQueryRow,
  };
});

describe('BlockRepository', () => {
  let repository: BlockRepository;
  let mockPool: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool();
    mockQuery = vi.fn();
    mockPool.query = mockQuery;
    repository = new BlockRepository(mockPool);
  });

  describe('getBlockByNumber', () => {
    it('should return block when exists', async () => {
      const expectedBlock: Block = {
        hash: '0x' + 'a'.repeat(64),
        number: 1000n,
        parentHashes: ['0x' + 'b'.repeat(64)],
        timestamp: 1706150400000n,
        miner: '0x' + 'c'.repeat(40),
        gasLimit: 30000000n,
        gasUsed: 8000000n,
        blueScore: 1000n,
        isChainBlock: true,
        transactionCount: 42,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          hash: expectedBlock.hash,
          number: expectedBlock.number.toString(),
          parent_hashes: expectedBlock.parentHashes,
          timestamp: expectedBlock.timestamp.toString(),
          miner_address: expectedBlock.miner,
          gas_limit: expectedBlock.gasLimit.toString(),
          gas_used: expectedBlock.gasUsed.toString(),
          base_fee_per_gas: null,
          blue_score: expectedBlock.blueScore.toString(),
          is_chain_block: expectedBlock.isChainBlock,
          selected_parent_hash: null,
          transactions_root: null,
          state_root: null,
          receipts_root: null,
          transaction_count: expectedBlock.transactionCount,
        }],
      });

      const result = await repository.getBlockByNumber(1000n);

      expect(result).not.toBeNull();
      expect(result?.hash).toBe(expectedBlock.hash);
      expect(result?.number).toBe(expectedBlock.number);
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return null when block does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getBlockByNumber(9999n);

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      mockQuery.mockRejectedValueOnce(error);

      await expect(repository.getBlockByNumber(1000n)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getBlockByHash', () => {
    it('should return block when exists', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const expectedBlock: Block = {
        hash: blockHash,
        number: 1000n,
        parentHashes: [],
        timestamp: 1706150400000n,
        miner: '0x' + 'c'.repeat(40),
        gasLimit: 30000000n,
        gasUsed: 8000000n,
        blueScore: 1000n,
        isChainBlock: true,
        transactionCount: 0,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          hash: expectedBlock.hash,
          number: expectedBlock.number.toString(),
          parent_hashes: expectedBlock.parentHashes,
          timestamp: expectedBlock.timestamp.toString(),
          miner_address: expectedBlock.miner,
          gas_limit: expectedBlock.gasLimit.toString(),
          gas_used: expectedBlock.gasUsed.toString(),
          base_fee_per_gas: null,
          blue_score: expectedBlock.blueScore.toString(),
          is_chain_block: expectedBlock.isChainBlock,
          selected_parent_hash: null,
          transactions_root: null,
          state_root: null,
          receipts_root: null,
          transaction_count: expectedBlock.transactionCount,
        }],
      });

      const result = await repository.getBlockByHash(blockHash);

      expect(result).not.toBeNull();
      expect(result?.hash).toBe(blockHash);
    });

    it('should return null when block does not exist', async () => {
      const blockHash = '0x' + '0'.repeat(64);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getBlockByHash(blockHash);

      expect(result).toBeNull();
    });
  });

  describe('getLatestBlocks', () => {
    it('should return latest blocks ordered by number DESC', async () => {
      const expectedBlocks = [
        {
          hash: '0x' + 'a'.repeat(64),
          number: '1002',
          parent_hashes: [],
          timestamp: '1706150402000',
          miner_address: '0x' + 'c'.repeat(40),
          gas_limit: '30000000',
          gas_used: '8000000',
          base_fee_per_gas: null,
          blue_score: '1002',
          is_chain_block: true,
          selected_parent_hash: null,
          transactions_root: null,
          state_root: null,
          receipts_root: null,
          transaction_count: 0,
        },
        {
          hash: '0x' + 'b'.repeat(64),
          number: '1001',
          parent_hashes: [],
          timestamp: '1706150401000',
          miner_address: '0x' + 'c'.repeat(40),
          gas_limit: '30000000',
          gas_used: '8000000',
          base_fee_per_gas: null,
          blue_score: '1001',
          is_chain_block: true,
          selected_parent_hash: null,
          transactions_root: null,
          state_root: null,
          receipts_root: null,
          transaction_count: 0,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedBlocks });

      const result = await repository.getLatestBlocks(10);

      expect(result).toHaveLength(2);
      expect(result[0].number).toBe(1002n);
      expect(result[1].number).toBe(1001n);
    });

    it('should return empty array when no blocks exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getLatestBlocks(10);

      expect(result).toEqual([]);
    });
  });
});

