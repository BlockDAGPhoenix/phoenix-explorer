import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { DAGController } from '@/controllers/DAGController';
import { IDAGService } from '@/interfaces/services/IDAGService';
import { DAGInfo } from '@/domain/DAG';

describe('DAGController', () => {
  let controller: DAGController;
  let mockService: IDAGService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getBlockDAGInfo: vi.fn(),
      getBlockParents: vi.fn(),
      getBlockChildren: vi.fn(),
    };

    controller = new DAGController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getBlockDAGInfo', () => {
    it('should return DAG info successfully', async () => {
      const blockNumber = '1000';
      const expectedDAGInfo: DAGInfo = {
        block: {
          hash: '0x' + 'a'.repeat(64),
          number: 1000n,
          blueScore: 1000n,
        },
        parents: [],
        children: [],
        relationships: [],
      };

      mockRequest.params = { blockNumber };
      vi.mocked(mockService.getBlockDAGInfo).mockResolvedValue(expectedDAGInfo);

      await controller.getBlockDAGInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getBlockDAGInfo).toHaveBeenCalledWith(1000n, 1);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedDAGInfo,
      });
    });

    it('should use depth from query parameter', async () => {
      mockRequest.params = { blockNumber: '1000' };
      mockRequest.query = { depth: '3' };
      vi.mocked(mockService.getBlockDAGInfo).mockResolvedValue(null);

      await controller.getBlockDAGInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getBlockDAGInfo).toHaveBeenCalledWith(1000n, 3);
    });

    it('should return 404 when block not found', async () => {
      mockRequest.params = { blockNumber: '999999' };
      vi.mocked(mockService.getBlockDAGInfo).mockResolvedValue(null);

      await controller.getBlockDAGInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle invalid block number', async () => {
      mockRequest.params = { blockNumber: 'invalid' };

      await controller.getBlockDAGInfo(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getBlockParents', () => {
    it('should return parent hashes', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const parents = ['0x' + 'b'.repeat(64)];

      mockRequest.params = { blockHash };
      vi.mocked(mockService.getBlockParents).mockResolvedValue(parents);

      await controller.getBlockParents(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { parents },
      });
    });
  });

  describe('getBlockChildren', () => {
    it('should return child hashes', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const children = ['0x' + 'c'.repeat(64)];

      mockRequest.params = { blockHash };
      vi.mocked(mockService.getBlockChildren).mockResolvedValue(children);

      await controller.getBlockChildren(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { children },
      });
    });
  });
});

