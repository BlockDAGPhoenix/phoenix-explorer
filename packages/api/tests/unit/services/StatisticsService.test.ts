import { describe, it, expect, beforeEach, vi } from 'vitest';
import { StatisticsService } from '@/services/StatisticsService';
import { IStatisticsRepository } from '@/interfaces/repositories/IStatisticsRepository';
import { BlockStatistics, NetworkStatistics } from '@/domain/Statistics';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let mockRepository: IStatisticsRepository;

  beforeEach(() => {
    mockRepository = {
      getBlockStatistics: vi.fn(),
      getNetworkStatistics: vi.fn(),
    };
    service = new StatisticsService(mockRepository);
  });

  describe('getBlockStatistics', () => {
    it('should return block statistics', async () => {
      const expectedStats: BlockStatistics = {
        totalBlocks: 1000000n,
        avgBlockTime: 1.02,
        avgGasUsed: 8000000n,
        avgTransactionsPerBlock: 50,
      };

      vi.mocked(mockRepository.getBlockStatistics).mockResolvedValue(expectedStats);

      const result = await service.getBlockStatistics();

      expect(result).toEqual(expectedStats);
      expect(mockRepository.getBlockStatistics).toHaveBeenCalledWith(undefined, undefined, 'day');
    });

    it('should pass time range and granularity to repository', async () => {
      const from = 1706150400000n;
      const to = 1706236800000n;
      const granularity = 'day' as const;

      vi.mocked(mockRepository.getBlockStatistics).mockResolvedValue({
        totalBlocks: 1000n,
        avgBlockTime: 1.0,
        avgGasUsed: 8000000n,
        avgTransactionsPerBlock: 50,
      });

      await service.getBlockStatistics(from, to, granularity);

      expect(mockRepository.getBlockStatistics).toHaveBeenCalledWith(from, to, granularity);
    });
  });

  describe('getNetworkStatistics', () => {
    it('should return network statistics', async () => {
      const expectedStats: NetworkStatistics = {
        totalBlocks: 1000000n,
        totalTransactions: 50000000n,
        totalAddresses: 100000n,
        totalContracts: 5000n,
        avgBlockTime: 1.02,
      };

      vi.mocked(mockRepository.getNetworkStatistics).mockResolvedValue(expectedStats);

      const result = await service.getNetworkStatistics();

      expect(result).toEqual(expectedStats);
      expect(mockRepository.getNetworkStatistics).toHaveBeenCalled();
    });
  });
});

