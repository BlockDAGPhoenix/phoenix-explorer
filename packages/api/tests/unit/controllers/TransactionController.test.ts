import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { TransactionController } from '@/controllers/TransactionController';
import { ITransactionService } from '@/interfaces/services/ITransactionService';
import { Transaction } from '@/domain/Transaction';

describe('TransactionController', () => {
  let controller: TransactionController;
  let mockService: ITransactionService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getTransactionByHash: vi.fn(),
      getTransactionsByBlockHash: vi.fn(),
      getLatestTransactions: vi.fn(),
    };

    controller = new TransactionController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getTransactionByHash', () => {
    it('should return transaction successfully', async () => {
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

      mockRequest.params = { hash: expectedTx.hash };
      vi.mocked(mockService.getTransactionByHash).mockResolvedValue(expectedTx);

      await controller.getTransactionByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getTransactionByHash).toHaveBeenCalledWith(expectedTx.hash);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedTx,
      });
    });

    it('should return 404 when transaction not found', async () => {
      const hash = '0x' + '0'.repeat(64);
      mockRequest.params = { hash };
      vi.mocked(mockService.getTransactionByHash).mockResolvedValue(null);

      await controller.getTransactionByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Transaction not found',
        },
      });
    });

    it('should handle invalid hash format', async () => {
      mockRequest.params = { hash: 'invalid-hash' };

      await controller.getTransactionByHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: {
          code: 'INVALID_PARAMETER',
          message: 'Invalid transaction hash format',
        },
      });
    });
  });

  describe('getTransactionsByBlockHash', () => {
    it('should return transactions for block', async () => {
      const blockHash = '0x' + 'b'.repeat(64);
      const expectedTxs: Transaction[] = [
        {
          hash: '0x' + 'a'.repeat(64),
          blockHash,
          blockNumber: 1000n,
          transactionIndex: 0,
          from: '0x' + 'c'.repeat(40),
          to: '0x' + 'd'.repeat(40),
          value: 1000000000000000000n,
          gasLimit: 21000n,
          nonce: 5n,
          input: '0x',
          status: 1,
          createsContract: false,
        },
      ];

      mockRequest.params = { blockHash };
      vi.mocked(mockService.getTransactionsByBlockHash).mockResolvedValue(expectedTxs);

      await controller.getTransactionsByBlockHash(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { transactions: expectedTxs },
      });
    });
  });

  describe('getLatestTransactions', () => {
    it('should return latest transactions', async () => {
      mockRequest.query = { limit: '10' };
      vi.mocked(mockService.getLatestTransactions).mockResolvedValue([]);

      await controller.getLatestTransactions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getLatestTransactions).toHaveBeenCalledWith(10);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should use default limit when not provided', async () => {
      mockRequest.query = {};
      vi.mocked(mockService.getLatestTransactions).mockResolvedValue([]);

      await controller.getLatestTransactions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getLatestTransactions).toHaveBeenCalledWith(20);
    });
  });
});

