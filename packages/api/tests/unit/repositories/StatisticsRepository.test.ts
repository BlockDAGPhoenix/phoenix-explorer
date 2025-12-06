import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatisticsRepository } from '@/repositories/StatisticsRepository';
import { Pool } from 'pg';

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

describe('StatisticsRepository', () => {
  let repository: StatisticsRepository;
  let mockPool: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool();
    mockQuery = vi.fn();
    mockPool.query = mockQuery;
    repository = new StatisticsRepository(mockPool);
  });

  describe('getBlockStatistics', () => {
    it('should return block statistics', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1000000' }] }) // totalBlocks
        .mockResolvedValueOnce({ rows: [{ avg: '1.02' }] }) // avgBlockTime
        .mockResolvedValueOnce({ rows: [{ avg: '8000000' }] }) // avgGasUsed
        .mockResolvedValueOnce({ rows: [{ avg: '50' }] }); // avgTransactionsPerBlock

      const result = await repository.getBlockStatistics();

      expect(result.totalBlocks).toBe(1000000n);
      expect(result.avgBlockTime).toBe(1.02);
      expect(result.avgGasUsed).toBe(8000000n);
      expect(result.avgTransactionsPerBlock).toBe(50);
    });

    it('should include time series when time range provided', async () => {
      const from = 1706150400000n;
      const to = 1706236800000n;

      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1000' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '1.0' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '8000000' }] })
        .mockResolvedValueOnce({ rows: [{ avg: '50' }] })
        .mockResolvedValueOnce({
          rows: [
            { timestamp: '1706150400000', block_count: 100, avg_block_time: 1.0 },
          ],
        });

      const result = await repository.getBlockStatistics(from, to, 'day');

      expect(result.timeSeries).toBeDefined();
      expect(result.timeSeries?.length).toBeGreaterThan(0);
    });
  });

  describe('getNetworkStatistics', () => {
    it('should return network statistics', async () => {
      mockQuery
        .mockResolvedValueOnce({ rows: [{ count: '1000000' }] }) // totalBlocks
        .mockResolvedValueOnce({ rows: [{ count: '50000000' }] }) // totalTransactions
        .mockResolvedValueOnce({ rows: [{ count: '100000' }] }) // totalAddresses
        .mockResolvedValueOnce({ rows: [{ count: '5000' }] }) // totalContracts
        .mockResolvedValueOnce({ rows: [{ avg: '1.02' }] }); // avgBlockTime

      const result = await repository.getNetworkStatistics();

      expect(result.totalBlocks).toBe(1000000n);
      expect(result.totalTransactions).toBe(50000000n);
      expect(result.totalAddresses).toBe(100000n);
      expect(result.totalContracts).toBe(5000n);
      expect(result.avgBlockTime).toBe(1.02);
    });
  });
});

