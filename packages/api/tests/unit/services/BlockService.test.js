"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BlockService_1 = require("@/services/BlockService");
(0, vitest_1.describe)('BlockService', () => {
    let service;
    let mockRepository;
    (0, vitest_1.beforeEach)(() => {
        mockRepository = {
            getBlockByNumber: vitest_1.vi.fn(),
            getBlockByHash: vitest_1.vi.fn(),
            getLatestBlocks: vitest_1.vi.fn(),
        };
        service = new BlockService_1.BlockService(mockRepository);
    });
    (0, vitest_1.describe)('getBlockByNumber', () => {
        (0, vitest_1.it)('should return block when exists', async () => {
            const expectedBlock = {
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
            vitest_1.vi.mocked(mockRepository.getBlockByNumber).mockResolvedValue(expectedBlock);
            const result = await service.getBlockByNumber(1000n);
            (0, vitest_1.expect)(result).toEqual(expectedBlock);
            (0, vitest_1.expect)(mockRepository.getBlockByNumber).toHaveBeenCalledWith(1000n);
        });
        (0, vitest_1.it)('should return null when block does not exist', async () => {
            vitest_1.vi.mocked(mockRepository.getBlockByNumber).mockResolvedValue(null);
            const result = await service.getBlockByNumber(9999n);
            (0, vitest_1.expect)(result).toBeNull();
            (0, vitest_1.expect)(mockRepository.getBlockByNumber).toHaveBeenCalledWith(9999n);
        });
        (0, vitest_1.it)('should propagate repository errors', async () => {
            const error = new Error('Database connection failed');
            vitest_1.vi.mocked(mockRepository.getBlockByNumber).mockRejectedValue(error);
            await (0, vitest_1.expect)(service.getBlockByNumber(1000n)).rejects.toThrow('Database connection failed');
        });
    });
    (0, vitest_1.describe)('getBlockByHash', () => {
        (0, vitest_1.it)('should return block when exists', async () => {
            const blockHash = '0x' + 'a'.repeat(64);
            const expectedBlock = {
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
            vitest_1.vi.mocked(mockRepository.getBlockByHash).mockResolvedValue(expectedBlock);
            const result = await service.getBlockByHash(blockHash);
            (0, vitest_1.expect)(result).toEqual(expectedBlock);
            (0, vitest_1.expect)(mockRepository.getBlockByHash).toHaveBeenCalledWith(blockHash);
        });
        (0, vitest_1.it)('should return null when block does not exist', async () => {
            const blockHash = '0x' + '0'.repeat(64); // Valid format but non-existent block
            vitest_1.vi.mocked(mockRepository.getBlockByHash).mockResolvedValue(null);
            const result = await service.getBlockByHash(blockHash);
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should validate hash format', async () => {
            const invalidHash = 'invalid-hash';
            await (0, vitest_1.expect)(service.getBlockByHash(invalidHash)).rejects.toThrow('Invalid block hash format');
        });
    });
    (0, vitest_1.describe)('getLatestBlocks', () => {
        (0, vitest_1.it)('should return latest blocks', async () => {
            const expectedBlocks = [
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
            vitest_1.vi.mocked(mockRepository.getLatestBlocks).mockResolvedValue(expectedBlocks);
            const result = await service.getLatestBlocks(10);
            (0, vitest_1.expect)(result).toEqual(expectedBlocks);
            (0, vitest_1.expect)(mockRepository.getLatestBlocks).toHaveBeenCalledWith(10);
        });
        (0, vitest_1.it)('should enforce maximum limit', async () => {
            await (0, vitest_1.expect)(service.getLatestBlocks(200)).rejects.toThrow('Limit cannot exceed 100');
        });
        (0, vitest_1.it)('should enforce minimum limit', async () => {
            await (0, vitest_1.expect)(service.getLatestBlocks(0)).rejects.toThrow('Limit must be at least 1');
        });
        (0, vitest_1.it)('should return empty array when no blocks exist', async () => {
            vitest_1.vi.mocked(mockRepository.getLatestBlocks).mockResolvedValue([]);
            const result = await service.getLatestBlocks(10);
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
});
//# sourceMappingURL=BlockService.test.js.map