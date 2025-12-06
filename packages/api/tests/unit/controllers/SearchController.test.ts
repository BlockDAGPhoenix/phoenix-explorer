import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { SearchController } from '@/controllers/SearchController';
import { ISearchService } from '@/interfaces/services/ISearchService';
import { SearchResult } from '@/domain/Search';

describe('SearchController', () => {
  let controller: SearchController;
  let mockService: ISearchService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      search: vi.fn(),
    };

    controller = new SearchController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('search', () => {
    it('should return search results successfully', async () => {
      const query = '0x' + 'a'.repeat(40);
      const expectedResults: SearchResult[] = [
        {
          type: 'address',
          address: query,
          isContract: false,
        },
      ];

      mockRequest.query = { q: query };
      vi.mocked(mockService.search).mockResolvedValue(expectedResults);

      await controller.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.search).toHaveBeenCalledWith(query);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { results: expectedResults },
      });
    });

    it('should return 400 when query is missing', async () => {
      mockRequest.query = {};

      await controller.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Query parameter "q" is required',
        },
      });
    });

    it('should return empty results when nothing found', async () => {
      mockRequest.query = { q: 'nonexistent' };
      vi.mocked(mockService.search).mockResolvedValue([]);

      await controller.search(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { results: [] },
      });
    });
  });
});

