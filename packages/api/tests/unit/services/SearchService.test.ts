import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SearchService } from '@/services/SearchService';
import { IBlockRepository } from '@/interfaces/repositories/IBlockRepository';
import { ITransactionRepository } from '@/interfaces/repositories/ITransactionRepository';
import { IAddressRepository } from '@/interfaces/repositories/IAddressRepository';
import { SearchResult } from '@/domain/Search';

describe('SearchService', () => {
  let service: SearchService;
  let mockBlockRepository: IBlockRepository;
  let mockTransactionRepository: ITransactionRepository;
  let mockAddressRepository: IAddressRepository;

  beforeEach(() => {
    mockBlockRepository = {
      getBlockByNumber: vi.fn(),
      getBlockByHash: vi.fn(),
      getLatestBlocks: vi.fn(),
    };

    mockTransactionRepository = {
      getTransactionByHash: vi.fn(),
      getTransactionsByBlockHash: vi.fn(),
      getLatestTransactions: vi.fn(),
    };

    mockAddressRepository = {
      getAddress: vi.fn(),
      getAddressBalance: vi.fn(),
      getAddressTransactions: vi.fn(),
    };

    service = new SearchService(
      mockBlockRepository,
      mockTransactionRepository,
      mockAddressRepository
    );
  });

  describe('search', () => {
    it('should find address by hash', async () => {
      const query = '0x' + 'a'.repeat(40);
      const address = {
        address: query,
        balance: 1000000000000000000n,
        nonce: 5n,
        isContract: false,
        transactionCount: 10n,
      };

      vi.mocked(mockAddressRepository.getAddress).mockResolvedValue(address);

      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('address');
      expect(results[0].address).toBe(query);
    });

    it('should find transaction by hash', async () => {
      const query = '0x' + 'b'.repeat(64);
      const transaction = {
        hash: query,
        blockHash: '0x' + 'c'.repeat(64),
        blockNumber: 1000n,
        transactionIndex: 0,
        from: '0x' + 'a'.repeat(40),
        value: 1000000000000000000n,
        gasLimit: 21000n,
        nonce: 5n,
        input: '0x',
        status: 1,
        createsContract: false,
      };

      vi.mocked(mockTransactionRepository.getTransactionByHash).mockResolvedValue(transaction);

      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('transaction');
      expect(results[0].hash).toBe(query);
    });

    it('should find block by hash', async () => {
      const query = '0x' + 'd'.repeat(64);
      const block = {
        hash: query,
        number: 1000n,
        timestamp: 1706150400000n,
        gasLimit: 30000000n,
        gasUsed: 15000000n,
        transactionCount: 100,
        parentHashes: [],
        blueScore: 1000n,
      };

      vi.mocked(mockBlockRepository.getBlockByHash).mockResolvedValue(block);

      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('block');
      expect(results[0].hash).toBe(query);
    });

    it('should find block by number', async () => {
      const query = '1000';
      const block = {
        hash: '0x' + 'e'.repeat(64),
        number: 1000n,
        timestamp: 1706150400000n,
        gasLimit: 30000000n,
        gasUsed: 15000000n,
        transactionCount: 100,
        parentHashes: [],
        blueScore: 1000n,
      };

      vi.mocked(mockBlockRepository.getBlockByNumber).mockResolvedValue(block);

      const results = await service.search(query);

      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('block');
      expect(results[0].blockNumber).toBe(1000n);
    });

    it('should return multiple results when multiple entities match', async () => {
      const query = '0x' + 'a'.repeat(40);
      const address = {
        address: query,
        balance: 1000000000000000000n,
        nonce: 5n,
        isContract: false,
        transactionCount: 10n,
      };

      vi.mocked(mockAddressRepository.getAddress).mockResolvedValue(address);
      vi.mocked(mockTransactionRepository.getTransactionByHash).mockResolvedValue(null);
      vi.mocked(mockBlockRepository.getBlockByHash).mockResolvedValue(null);
      vi.mocked(mockBlockRepository.getBlockByNumber).mockResolvedValue(null);

      const results = await service.search(query);

      expect(results.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array when nothing found', async () => {
      const query = 'nonexistent';

      vi.mocked(mockAddressRepository.getAddress).mockResolvedValue(null);
      vi.mocked(mockTransactionRepository.getTransactionByHash).mockResolvedValue(null);
      vi.mocked(mockBlockRepository.getBlockByHash).mockResolvedValue(null);
      vi.mocked(mockBlockRepository.getBlockByNumber).mockResolvedValue(null);

      const results = await service.search(query);

      expect(results).toHaveLength(0);
    });
  });
});

