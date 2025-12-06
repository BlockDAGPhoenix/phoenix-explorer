import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BlockService } from '@/services/BlockService';
import { IBlockRepository } from '@/interfaces/repositories/IBlockRepository';
import { Block } from '@/domain/Block';

describe('BlockService', () => {
  let service: BlockService;
  let mockRepository: IBlockRepository;

  beforeEach(() => {
    mockRepository = {
      getBlockByNumber: vi.fn(),
      getBlockByHash: vi.fn(),
      getLatestBlocks: vi.fn(),
    };
    service = new BlockService(mockRepository);
  });

  describe('getBlockByNumber', () => {
    it('should return block when exists', async () => {
      const expectedBlock: Block = {
        hash: '0x' + 'a'.repeat(64),
        number: 1000n,
        parentHashes: ['0x' + 'b'.repeat(64)],
        timestamp: 1706150400000n,
        miner: '0x' + 'c'.repeat(40),
        gasLimit: 30000000n,
        gasUsed: 8000000n,
        blueScore: 1000n,
        isChainBlock: true,
        transactionCount: 42,
      };

      vi.mocked(mockRepository.getBlockByNumber).mockResolvedValue(expectedBlock);

      const result = await service.getBlockByNumber(1000n);

      expect(result).toEqual(expectedBlock);
      expect(mockRepository.getBlockByNumber).toHaveBeenCalledWith(1000n);
    });

    it('should return null when block does not exist', async () => {
      vi.mocked(mockRepository.getBlockByNumber).mockResolvedValue(null);

      const result = await service.getBlockByNumber(9999n);

      expect(result).toBeNull();
      expect(mockRepository.getBlockByNumber).toHaveBeenCalledWith(9999n);
    });

    it('should propagate repository errors', async () => {
      const error = new Error('Database connection failed');
      vi.mocked(mockRepository.getBlockByNumber).mockRejectedValue(error);

      await expect(service.getBlockByNumber(1000n)).rejects.toThrow(
        'Database connection failed'
      );
    });
  });

  describe('getBlockByHash', () => {
    it('should return block when exists', async () => {
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

      vi.mocked(mockRepository.getBlockByHash).mockResolvedValue(expectedBlock);

      const result = await service.getBlockByHash(blockHash);

      expect(result).toEqual(expectedBlock);
      expect(mockRepository.getBlockByHash).toHaveBeenCalledWith(blockHash);
    });

    it('should return null when block does not exist', async () => {
      const blockHash = '0x' + '0'.repeat(64); // Valid format but non-existent block
      vi.mocked(mockRepository.getBlockByHash).mockResolvedValue(null);

      const result = await service.getBlockByHash(blockHash);

      expect(result).toBeNull();
    });

    it('should validate hash format', async () => {
      const invalidHash = 'invalid-hash';

      await expect(service.getBlockByHash(invalidHash)).rejects.toThrow(
        'Invalid block hash format'
      );
    });
  });

  describe('getLatestBlocks', () => {
    it('should return latest blocks', async () => {
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
        {
          hash: '0x' + 'b'.repeat(64),
          number: 1001n,
          parentHashes: [],
          timestamp: 1706150401000n,
          miner: '0x' + 'c'.repeat(40),
          gasLimit: 30000000n,
          gasUsed: 8000000n,
          blueScore: 1001n,
          isChainBlock: true,
          transactionCount: 0,
        },
      ];

      vi.mocked(mockRepository.getLatestBlocks).mockResolvedValue(expectedBlocks);

      const result = await service.getLatestBlocks(10);

      expect(result).toEqual(expectedBlocks);
      expect(mockRepository.getLatestBlocks).toHaveBeenCalledWith(10);
    });

    it('should enforce maximum limit', async () => {
      await expect(service.getLatestBlocks(200)).rejects.toThrow(
        'Limit cannot exceed 100'
      );
    });

    it('should enforce minimum limit', async () => {
      await expect(service.getLatestBlocks(0)).rejects.toThrow(
        'Limit must be at least 1'
      );
    });

    it('should return empty array when no blocks exist', async () => {
      vi.mocked(mockRepository.getLatestBlocks).mockResolvedValue([]);

      const result = await service.getLatestBlocks(10);

      expect(result).toEqual([]);
    });
  });
});

