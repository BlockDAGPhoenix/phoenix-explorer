"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const BlockController_1 = require("@/controllers/BlockController");
(0, vitest_1.describe)('BlockController', () => {
    let controller;
    let mockService;
    let mockRequest;
    let mockResponse;
    (0, vitest_1.beforeEach)(() => {
        mockService = {
            getBlockByNumber: vitest_1.vi.fn(),
            getBlockByHash: vitest_1.vi.fn(),
            getLatestBlocks: vitest_1.vi.fn(),
        };
        controller = new BlockController_1.BlockController(mockService);
        mockRequest = {
            params: {},
            query: {},
        };
        mockResponse = {
            status: vitest_1.vi.fn().mockReturnThis(),
            json: vitest_1.vi.fn().mockReturnThis(),
        };
    });
    (0, vitest_1.describe)('getLatestBlocks', () => {
        (0, vitest_1.it)('should return latest blocks successfully', async () => {
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
            ];
            mockRequest.query = { limit: '10' };
            vitest_1.vi.mocked(mockService.getLatestBlocks).mockResolvedValue(expectedBlocks);
            await controller.getLatestBlocks(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockService.getLatestBlocks).toHaveBeenCalledWith(10);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: { blocks: expectedBlocks },
            });
        });
        (0, vitest_1.it)('should use default limit when not provided', async () => {
            mockRequest.query = {};
            vitest_1.vi.mocked(mockService.getLatestBlocks).mockResolvedValue([]);
            await controller.getLatestBlocks(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockService.getLatestBlocks).toHaveBeenCalledWith(20);
        });
        (0, vitest_1.it)('should handle service errors', async () => {
            mockRequest.query = { limit: '10' };
            const error = new Error('Service error');
            vitest_1.vi.mocked(mockService.getLatestBlocks).mockRejectedValue(error);
            await controller.getLatestBlocks(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(500);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Service error',
                },
            });
        });
    });
    (0, vitest_1.describe)('getBlockByNumber', () => {
        (0, vitest_1.it)('should return block successfully', async () => {
            const expectedBlock = {
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
            vitest_1.vi.mocked(mockService.getBlockByNumber).mockResolvedValue(expectedBlock);
            await controller.getBlockByNumber(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockService.getBlockByNumber).toHaveBeenCalledWith(1000n);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedBlock,
            });
        });
        (0, vitest_1.it)('should return 404 when block not found', async () => {
            mockRequest.params = { blockNumber: '9999' };
            vitest_1.vi.mocked(mockService.getBlockByNumber).mockResolvedValue(null);
            await controller.getBlockByNumber(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(404);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Block not found',
                },
            });
        });
        (0, vitest_1.it)('should handle invalid block number', async () => {
            mockRequest.params = { blockNumber: 'invalid' };
            await controller.getBlockByNumber(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'Invalid block number format',
                },
            });
        });
    });
    (0, vitest_1.describe)('getBlockByHash', () => {
        (0, vitest_1.it)('should return block successfully', async () => {
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
            mockRequest.params = { hash: blockHash };
            vitest_1.vi.mocked(mockService.getBlockByHash).mockResolvedValue(expectedBlock);
            await controller.getBlockByHash(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockService.getBlockByHash).toHaveBeenCalledWith(blockHash);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(200);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: true,
                data: expectedBlock,
            });
        });
        (0, vitest_1.it)('should return 404 when block not found', async () => {
            const blockHash = '0x' + '0'.repeat(64);
            mockRequest.params = { hash: blockHash };
            vitest_1.vi.mocked(mockService.getBlockByHash).mockResolvedValue(null);
            await controller.getBlockByHash(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(404);
        });
        (0, vitest_1.it)('should handle invalid hash format', async () => {
            mockRequest.params = { hash: 'invalid-hash' };
            await controller.getBlockByHash(mockRequest, mockResponse);
            (0, vitest_1.expect)(mockResponse.status).toHaveBeenCalledWith(400);
            (0, vitest_1.expect)(mockResponse.json).toHaveBeenCalledWith({
                success: false,
                error: {
                    code: 'INVALID_PARAMETER',
                    message: 'Invalid block hash format',
                },
            });
        });
    });
});
//# sourceMappingURL=BlockController.test.js.map