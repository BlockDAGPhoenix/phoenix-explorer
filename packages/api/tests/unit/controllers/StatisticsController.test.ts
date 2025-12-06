import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { StatisticsController } from '@/controllers/StatisticsController';
import { IStatisticsService } from '@/interfaces/services/IStatisticsService';
import { BlockStatistics, NetworkStatistics } from '@/domain/Statistics';

describe('StatisticsController', () => {
  let controller: StatisticsController;
  let mockService: IStatisticsService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getBlockStatistics: vi.fn(),
      getNetworkStatistics: vi.fn(),
    };

    controller = new StatisticsController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getBlockStatistics', () => {
    it('should return block statistics successfully', async () => {
      const expectedStats: BlockStatistics = {
        totalBlocks: 1000000n,
        avgBlockTime: 1.02,
        avgGasUsed: 8000000n,
        avgTransactionsPerBlock: 50,
      };

      vi.mocked(mockService.getBlockStatistics).mockResolvedValue(expectedStats);

      await controller.getBlockStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedStats,
      });
    });

    it('should parse query parameters', async () => {
      mockRequest.query = {
        from: '1706150400000',
        to: '1706236800000',
        granularity: 'day',
      };

      vi.mocked(mockService.getBlockStatistics).mockResolvedValue({
        totalBlocks: 1000n,
        avgBlockTime: 1.0,
        avgGasUsed: 8000000n,
        avgTransactionsPerBlock: 50,
      });

      await controller.getBlockStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getBlockStatistics).toHaveBeenCalledWith(
        1706150400000n,
        1706236800000n,
        'day'
      );
    });
  });

  describe('getNetworkStatistics', () => {
    it('should return network statistics successfully', async () => {
      const expectedStats: NetworkStatistics = {
        totalBlocks: 1000000n,
        totalTransactions: 50000000n,
        totalAddresses: 100000n,
        totalContracts: 5000n,
        avgBlockTime: 1.02,
      };

      vi.mocked(mockService.getNetworkStatistics).mockResolvedValue(expectedStats);

      await controller.getNetworkStatistics(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedStats,
      });
    });
  });
});

