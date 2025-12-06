"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BlockRepository_1 = require("@/repositories/BlockRepository");
const pg_1 = require("pg");
// Mock pg Pool
vitest_1.vi.mock('pg', () => {
    const mockQuery = vitest_1.vi.fn();
    const mockQueryRow = vitest_1.vi.fn();
    return {
        Pool: vitest_1.vi.fn().mockImplementation(() => ({
            query: mockQuery,
            connect: vitest_1.vi.fn(),
            end: vitest_1.vi.fn(),
        })),
        mockQuery,
        mockQueryRow,
    };
});
(0, vitest_1.describe)('BlockRepository', () => {
    let repository;
    let mockPool;
    let mockQuery;
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        mockPool = new pg_1.Pool();
        mockQuery = vitest_1.vi.fn();
        mockPool.query = mockQuery;
        repository = new BlockRepository_1.BlockRepository(mockPool);
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
            mockQuery.mockResolvedValueOnce({
                rows: [{
                        hash: expectedBlock.hash,
                        number: expectedBlock.number.toString(),
                        parent_hashes: expectedBlock.parentHashes,
                        timestamp: expectedBlock.timestamp.toString(),
                        miner_address: expectedBlock.miner,
                        gas_limit: expectedBlock.gasLimit.toString(),
                        gas_used: expectedBlock.gasUsed.toString(),
                        base_fee_per_gas: null,
                        blue_score: expectedBlock.blueScore.toString(),
                        is_chain_block: expectedBlock.isChainBlock,
                        selected_parent_hash: null,
                        transactions_root: null,
                        state_root: null,
                        receipts_root: null,
                        transaction_count: expectedBlock.transactionCount,
                    }],
            });
            const result = await repository.getBlockByNumber(1000n);
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result?.hash).toBe(expectedBlock.hash);
            (0, vitest_1.expect)(result?.number).toBe(expectedBlock.number);
            (0, vitest_1.expect)(mockQuery).toHaveBeenCalled();
        });
        (0, vitest_1.it)('should return null when block does not exist', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await repository.getBlockByNumber(9999n);
            (0, vitest_1.expect)(result).toBeNull();
        });
        (0, vitest_1.it)('should handle database errors', async () => {
            const error = new Error('Database connection failed');
            mockQuery.mockRejectedValueOnce(error);
            await (0, vitest_1.expect)(repository.getBlockByNumber(1000n)).rejects.toThrow('Database connection failed');
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
            mockQuery.mockResolvedValueOnce({
                rows: [{
                        hash: expectedBlock.hash,
                        number: expectedBlock.number.toString(),
                        parent_hashes: expectedBlock.parentHashes,
                        timestamp: expectedBlock.timestamp.toString(),
                        miner_address: expectedBlock.miner,
                        gas_limit: expectedBlock.gasLimit.toString(),
                        gas_used: expectedBlock.gasUsed.toString(),
                        base_fee_per_gas: null,
                        blue_score: expectedBlock.blueScore.toString(),
                        is_chain_block: expectedBlock.isChainBlock,
                        selected_parent_hash: null,
                        transactions_root: null,
                        state_root: null,
                        receipts_root: null,
                        transaction_count: expectedBlock.transactionCount,
                    }],
            });
            const result = await repository.getBlockByHash(blockHash);
            (0, vitest_1.expect)(result).not.toBeNull();
            (0, vitest_1.expect)(result?.hash).toBe(blockHash);
        });
        (0, vitest_1.it)('should return null when block does not exist', async () => {
            const blockHash = '0x' + '0'.repeat(64);
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await repository.getBlockByHash(blockHash);
            (0, vitest_1.expect)(result).toBeNull();
        });
    });
    (0, vitest_1.describe)('getLatestBlocks', () => {
        (0, vitest_1.it)('should return latest blocks ordered by number DESC', async () => {
            const expectedBlocks = [
                {
                    hash: '0x' + 'a'.repeat(64),
                    number: '1002',
                    parent_hashes: [],
                    timestamp: '1706150402000',
                    miner_address: '0x' + 'c'.repeat(40),
                    gas_limit: '30000000',
                    gas_used: '8000000',
                    base_fee_per_gas: null,
                    blue_score: '1002',
                    is_chain_block: true,
                    selected_parent_hash: null,
                    transactions_root: null,
                    state_root: null,
                    receipts_root: null,
                    transaction_count: 0,
                },
                {
                    hash: '0x' + 'b'.repeat(64),
                    number: '1001',
                    parent_hashes: [],
                    timestamp: '1706150401000',
                    miner_address: '0x' + 'c'.repeat(40),
                    gas_limit: '30000000',
                    gas_used: '8000000',
                    base_fee_per_gas: null,
                    blue_score: '1001',
                    is_chain_block: true,
                    selected_parent_hash: null,
                    transactions_root: null,
                    state_root: null,
                    receipts_root: null,
                    transaction_count: 0,
                },
            ];
            mockQuery.mockResolvedValueOnce({ rows: expectedBlocks });
            const result = await repository.getLatestBlocks(10);
            (0, vitest_1.expect)(result).toHaveLength(2);
            (0, vitest_1.expect)(result[0].number).toBe(1002n);
            (0, vitest_1.expect)(result[1].number).toBe(1001n);
        });
        (0, vitest_1.it)('should return empty array when no blocks exist', async () => {
            mockQuery.mockResolvedValueOnce({ rows: [] });
            const result = await repository.getLatestBlocks(10);
            (0, vitest_1.expect)(result).toEqual([]);
        });
    });
});
//# sourceMappingURL=BlockRepository.test.js.map