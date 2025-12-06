import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { BlockController } from '@/controllers/BlockController';
import { IBlockService } from '@/interfaces/services/IBlockService';
import { Block } from '@/domain/Block';

describe('BlockController', () => {
  let controller: BlockController;
  let mockService: IBlockService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getBlockByNumber: vi.fn(),
      getBlockByHash: vi.fn(),
      getLatestBlocks: vi.fn(),
    };

    controller = new BlockController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getLatestBlocks', () => {
    it('should return latest blocks successfully', async () => {
      const expectedBlocks: Block[] = [
        {
          hash: '0x' + 'a'.repeat(64),
          number: 1002n,
          parentHashes: [],
          timestamp: 1706150402000n,
          miner: '0x' + 'c'.repeat(40),
          gasLimit: 30000000n,
          gasUsed: 8000000n,
          blueScore: 1002n,
          isChainBlock: true,
          transactionCount: 0,
        },
      ];

      mockRequest.query = { limit: '10' };
      vi.mocked(mockService.getLatestBlocks).mockResolvedValue(expectedBlocks);

      await controller.getLatestBlocks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getLatestBlocks).toHaveBeenCalledWith(10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { blocks: expectedBlocks },
      });
    });

    it('should use default limit when not provided', async () => {
      mockRequest.query = {};
      vi.mocked(mockService.getLatestBlocks).mockResolvedValue([]);

      await controller.getLatestBlocks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getLatestBlocks).toHaveBeenCalledWith(20);
    });

    it('should handle service errors', async () => {
      mockRequest.query = { limit: '10' };
      const error = new Error('Service error');
      vi.mocked(mockService.getLatestBlocks).mockRejectedValue(error);

      await controller.getLatestBlocks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Service error',
        },
      });
    });
  });

  describe('getBlockByNumber', () => {
    it('should return block successfully', async () => {
      const expectedBlock: Block = {
        hash: '0x' + 'a'.repeat(64),
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

      mockRequest.params = { blockNumber: '1000' };
      vi.mocked(mockService.getBlockByNumber).mockResolvedValue(expectedBlock);

      await controller.getBlockByNumber(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getBlockByNumber).toHaveBeenCalledWith(1000n);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedBlock,
      });
    });

    it('should return 404 when block not found', async () => {
      mockRequest.params = { blockNumber: '9999' };
      vi.mocked(mockService.getBlockByNumber).mockResolvedValue(null);

      await controller.getBlockByNumber(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Block not found',
        },
      });
    });

    it('should handle invalid block number', async () => {
      mockRequest.params = { blockNumber: 'invalid' };

      await controller.getBlockByNumber(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid block number format',
        },
      });
    });
  });

  describe('getBlockByHash', () => {
    it('should return block successfully', async () => {
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

      mockRequest.params = { hash: blockHash };
      vi.mocked(mockService.getBlockByHash).mockResolvedValue(expectedBlock);

      await controller.getBlockByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getBlockByHash).toHaveBeenCalledWith(blockHash);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedBlock,
      });
    });

    it('should return 404 when block not found', async () => {
      const blockHash = '0x' + '0'.repeat(64);
      mockRequest.params = { hash: blockHash };
      vi.mocked(mockService.getBlockByHash).mockResolvedValue(null);

      await controller.getBlockByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle invalid hash format', async () => {
      mockRequest.params = { hash: 'invalid-hash' };

      await controller.getBlockByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid block hash format',
        },
      });
    });
  });
});

