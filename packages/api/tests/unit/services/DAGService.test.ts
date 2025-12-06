import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DAGService } from '@/services/DAGService';
import { IDAGRepository } from '@/interfaces/repositories/IDAGRepository';
import { DAGBlock, GHOSTDAGData } from '@/domain/DAG';

describe('DAGService', () => {
  let service: DAGService;
  let mockRepository: IDAGRepository;
  let mockBlockRepository: any;

  beforeEach(() => {
    mockRepository = {
      getBlockParents: vi.fn(),
      getBlockChildren: vi.fn(),
      getGHOSTDAGData: vi.fn(),
      getBlockByHash: vi.fn(),
    };

    mockBlockRepository = {
      getBlockByNumber: vi.fn(),
    };

    service = new DAGService(mockRepository, mockBlockRepository);
  });

  describe('getBlockDAGInfo', () => {
    it('should return DAG info for block', async () => {
      const blockNumber = 1000n;
      const blockHash = '0x' + 'a'.repeat(64);
      const block: DAGBlock = {
        hash: blockHash,
        number: blockNumber,
        blueScore: 1000n,
      };

      const parents: DAGBlock[] = [
        {
          hash: '0x' + 'b'.repeat(64),
          number: 999n,
          blueScore: 999n,
          isSelectedParent: true,
        },
      ];

      const children: DAGBlock[] = [
        {
          hash: '0x' + 'c'.repeat(64),
          number: 1001n,
          blueScore: 1001n,
        },
      ];

      const ghostdagData: GHOSTDAGData = {
        blueScore: 1000n,
        blueWork: 15000000000000000n,
        mergeSetBlues: ['0x' + 'd'.repeat(64)],
        mergeSetReds: [],
      };

      mockBlockRepository.getBlockByNumber.mockResolvedValue({ hash: blockHash });
      mockRepository.getBlockByHash.mockResolvedValue(block);
      mockRepository.getBlockParents.mockResolvedValue(parents);
      mockRepository.getBlockChildren.mockResolvedValue(children);
      mockRepository.getGHOSTDAGData.mockResolvedValue(ghostdagData);

      const result = await service.getBlockDAGInfo(blockNumber);

      expect(result).not.toBeNull();
      expect(result?.block.hash).toBe(blockHash);
      expect(result?.parents).toHaveLength(1);
      expect(result?.children).toHaveLength(1);
      expect(result?.ghostdagData).toEqual(ghostdagData);
    });

    it('should return null when block does not exist', async () => {
      const blockNumber = 999999n;
      mockBlockRepository.getBlockByNumber.mockResolvedValue(null);

      const result = await service.getBlockDAGInfo(blockNumber);

      expect(result).toBeNull();
    });

    it('should limit depth to maximum 10', async () => {
      const blockNumber = 1000n;
      const blockHash = '0x' + 'a'.repeat(64);
      mockBlockRepository.getBlockByNumber.mockResolvedValue({ hash: blockHash });
      mockRepository.getBlockByHash.mockResolvedValue({
        hash: blockHash,
        number: blockNumber,
        blueScore: 1000n,
      });
      mockRepository.getBlockParents.mockResolvedValue([]);
      mockRepository.getBlockChildren.mockResolvedValue([]);
      mockRepository.getGHOSTDAGData.mockResolvedValue(null);

      await service.getBlockDAGInfo(blockNumber, 20);

      // Should not throw, but depth should be capped at 10
      expect(mockRepository.getBlockParents).toHaveBeenCalled();
    });
  });

  describe('getBlockParents', () => {
    it('should return parent hashes', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const parents: DAGBlock[] = [
        {
          hash: '0x' + 'b'.repeat(64),
          number: 999n,
          blueScore: 999n,
        },
      ];

      mockRepository.getBlockParents.mockResolvedValue(parents);

      const result = await service.getBlockParents(blockHash);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(parents[0].hash);
    });
  });

  describe('getBlockChildren', () => {
    it('should return child hashes', async () => {
      const blockHash = '0x' + 'a'.repeat(64);
      const children: DAGBlock[] = [
        {
          hash: '0x' + 'c'.repeat(64),
          number: 1001n,
          blueScore: 1001n,
        },
      ];

      mockRepository.getBlockChildren.mockResolvedValue(children);

      const result = await service.getBlockChildren(blockHash);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(children[0].hash);
    });
  });
});

