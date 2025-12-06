import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransactionService } from '@/services/TransactionService';
import { ITransactionRepository } from '@/interfaces/repositories/ITransactionRepository';
import { Transaction } from '@/domain/Transaction';

describe('TransactionService', () => {
  let service: TransactionService;
  let mockRepository: ITransactionRepository;

  beforeEach(() => {
    mockRepository = {
      getTransactionByHash: vi.fn(),
      getTransactionsByBlockHash: vi.fn(),
      getLatestTransactions: vi.fn(),
    };
    service = new TransactionService(mockRepository);
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

      vi.mocked(mockRepository.getTransactionByHash).mockResolvedValue(expectedTx);

      const result = await service.getTransactionByHash(expectedTx.hash);

      expect(result).toEqual(expectedTx);
      expect(mockRepository.getTransactionByHash).toHaveBeenCalledWith(expectedTx.hash);
    });

    it('should return null when transaction does not exist', async () => {
      const hash = '0x' + '0'.repeat(64); // Valid format but non-existent transaction
      vi.mocked(mockRepository.getTransactionByHash).mockResolvedValue(null);

      const result = await service.getTransactionByHash(hash);

      expect(result).toBeNull();
    });

    it('should validate hash format', async () => {
      const invalidHash = 'invalid-hash';

      await expect(service.getTransactionByHash(invalidHash)).rejects.toThrow(
        'Invalid transaction hash format'
      );
    });

    it('should propagate repository errors', async () => {
      const hash = '0x' + 'a'.repeat(64);
      const error = new Error('Database connection failed');
      vi.mocked(mockRepository.getTransactionByHash).mockRejectedValue(error);

      await expect(service.getTransactionByHash(hash)).rejects.toThrow(
        'Database connection failed'
      );
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

      vi.mocked(mockRepository.getTransactionsByBlockHash).mockResolvedValue(expectedTxs);

      const result = await service.getTransactionsByBlockHash(blockHash);

      expect(result).toEqual(expectedTxs);
      expect(mockRepository.getTransactionsByBlockHash).toHaveBeenCalledWith(blockHash);
    });

    it('should validate block hash format', async () => {
      const invalidHash = 'invalid-hash';

      await expect(service.getTransactionsByBlockHash(invalidHash)).rejects.toThrow(
        'Invalid block hash format'
      );
    });
  });

  describe('getLatestTransactions', () => {
    it('should return latest transactions', async () => {
      const expectedTxs: Transaction[] = [
        {
          hash: '0x' + 'a'.repeat(64),
          blockHash: '0x' + 'b'.repeat(64),
          blockNumber: 1002n,
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

      vi.mocked(mockRepository.getLatestTransactions).mockResolvedValue(expectedTxs);

      const result = await service.getLatestTransactions(10);

      expect(result).toEqual(expectedTxs);
      expect(mockRepository.getLatestTransactions).toHaveBeenCalledWith(10);
    });

    it('should enforce maximum limit', async () => {
      await expect(service.getLatestTransactions(200)).rejects.toThrow(
        'Limit cannot exceed 100'
      );
    });

    it('should enforce minimum limit', async () => {
      await expect(service.getLatestTransactions(0)).rejects.toThrow(
        'Limit must be at least 1'
      );
    });
  });
});

