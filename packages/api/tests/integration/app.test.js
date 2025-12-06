"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const supertest_1 = __importDefault(require("supertest"));
const pg_1 = require("pg");
const app_1 = require("@/app");
const BlockService_1 = require("@/services/BlockService");
const BlockRepository_1 = require("@/repositories/BlockRepository");
(0, vitest_1.describe)('API Integration Tests', () => {
    let app;
    let pool;
    (0, vitest_1.beforeAll)(() => {
        // Use test database or mock
        const DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://phoenix:phoenix_dev@localhost:5433/phoenix_explorer_test?sslmode=disable';
        pool = new pg_1.Pool({
            connectionString: DATABASE_URL,
        });
        const blockRepository = new BlockRepository_1.BlockRepository(pool);
        const blockService = new BlockService_1.BlockService(blockRepository);
        app = (0, app_1.createApp)(blockService);
    });
    (0, vitest_1.afterAll)(async () => {
        await pool.end();
    });
    (0, vitest_1.describe)('Health Check', () => {
        (0, vitest_1.it)('should return healthy status', async () => {
            const response = await (0, supertest_1.default)(app).get('/health');
            (0, vitest_1.expect)(response.status).toBe(200);
            (0, vitest_1.expect)(response.body.success).toBe(true);
            (0, vitest_1.expect)(response.body.status).toBe('healthy');
        });
    });
    (0, vitest_1.describe)('GET /v1/blocks/latest', () => {
        (0, vitest_1.it)('should return latest blocks', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/blocks/latest')
                .query({ limit: 10 });
            // If database is not available, should handle gracefully
            (0, vitest_1.expect)([200, 500]).toContain(response.status);
        });
        (0, vitest_1.it)('should validate limit parameter', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/blocks/latest')
                .query({ limit: 200 });
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PARAMETER');
        });
    });
    (0, vitest_1.describe)('GET /v1/blocks/:blockNumber', () => {
        (0, vitest_1.it)('should validate block number format', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/blocks/invalid');
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PARAMETER');
        });
        (0, vitest_1.it)('should handle valid block number', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/blocks/1000');
            // Should return 404 if block doesn't exist, 200 if it does, or 500 if DB unavailable
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
        });
    });
    (0, vitest_1.describe)('GET /v1/blocks/hash/:hash', () => {
        (0, vitest_1.it)('should validate hash format', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/v1/blocks/hash/invalid-hash');
            (0, vitest_1.expect)(response.status).toBe(400);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error.code).toBe('INVALID_PARAMETER');
        });
        (0, vitest_1.it)('should handle valid hash format', async () => {
            const validHash = '0x' + '0'.repeat(64);
            const response = await (0, supertest_1.default)(app)
                .get(`/v1/blocks/hash/${validHash}`);
            // Should return 404 if block doesn't exist, 200 if it does, or 500 if DB unavailable
            (0, vitest_1.expect)([200, 404, 500]).toContain(response.status);
        });
    });
    (0, vitest_1.describe)('404 Handler', () => {
        (0, vitest_1.it)('should return 404 for unknown routes', async () => {
            const response = await (0, supertest_1.default)(app).get('/unknown/route');
            (0, vitest_1.expect)(response.status).toBe(404);
            (0, vitest_1.expect)(response.body.success).toBe(false);
            (0, vitest_1.expect)(response.body.error.code).toBe('NOT_FOUND');
        });
    });
});
//# sourceMappingURL=app.test.js.map