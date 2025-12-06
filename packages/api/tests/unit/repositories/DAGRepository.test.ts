import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DAGRepository } from '@/repositories/DAGRepository';
import { Pool } from 'pg';
import { DAGBlock, GHOSTDAGData } from '@/domain/DAG';

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

describe('DAGRepository', () => {
  let repository: DAGRepository;
  let mockPool: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool();
    mockQuery = vi.fn();
    mockPool.query = mockQuery;
    repository = new DAGRepository(mockPool);
  });

  describe('getBlockParents', () => {
    it('should return parent blocks', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const expectedRows = [
        {
          hash: '0x' + 'b'.repeat(64),
          number: '999',
          blue_score: '999',
          is_selected_parent: true,
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedRows });

      const result = await repository.getBlockParents(blockHash);

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe(expectedRows[0].hash);
      expect(result[0].isSelectedParent).toBe(true);
    });
  });

  describe('getBlockChildren', () => {
    it('should return child blocks', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const expectedRows = [
        {
          hash: '0x' + 'c'.repeat(64),
          number: '1001',
          blue_score: '1001',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedRows });

      const result = await repository.getBlockChildren(blockHash);

      expect(result).toHaveLength(1);
      expect(result[0].hash).toBe(expectedRows[0].hash);
    });
  });

  describe('getGHOSTDAGData', () => {
    it('should return GHOSTDAG data when exists', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const expectedRow = {
        blue_score: '1000',
        blue_work: '15000000000000000',
        merge_set_blues: ['0x' + 'd'.repeat(64)],
        merge_set_reds: [],
      };

      mockQuery.mockResolvedValueOnce({ rows: [expectedRow] });

      const result = await repository.getGHOSTDAGData(blockHash);

      expect(result).not.toBeNull();
      expect(result?.blueScore).toBe(1000n);
      expect(result?.mergeSetBlues).toHaveLength(1);
    });

    it('should return null when GHOSTDAG data does not exist', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getGHOSTDAGData(blockHash);

      expect(result).toBeNull();
    });
  });

  describe('getBlockByHash', () => {
    it('should return block when exists', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const expectedRow = {
        hash: blockHash,
        number: '1000',
        blue_score: '1000',
      };

      mockQuery.mockResolvedValueOnce({ rows: [expectedRow] });

      const result = await repository.getBlockByHash(blockHash);

      expect(result).not.toBeNull();
      expect(result?.hash).toBe(blockHash);
    });
  });
});

