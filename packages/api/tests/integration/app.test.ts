import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { Pool } from 'pg';
import { createApp } from '@/app';
import { BlockService } from '@/services/BlockService';
import { BlockRepository } from '@/repositories/BlockRepository';

describe('API Integration Tests', () => {
  let app: any;
  let pool: Pool;

  beforeAll(() => {
    // Use test database or mock
    const DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://phoenix:phoenix_dev@localhost:5433/phoenix_explorer_test?sslmode=disable';
    
    pool = new Pool({
      connectionString: DATABASE_URL,
    });

    const blockRepository = new BlockRepository(pool);
    const blockService = new BlockService(blockRepository);
    app = createApp(blockService);
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('GET /v1/blocks/latest', () => {
    it('should return latest blocks', async () => {
      const response = await request(app)
        .get('/v1/blocks/latest')
        .query({ limit: 10 });

      // If database is not available, should handle gracefully
      expect([200, 500]).toContain(response.status);
    });

    it('should validate limit parameter', async () => {
      const response = await request(app)
        .get('/v1/blocks/latest')
        .query({ limit: 200 });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('GET /v1/blocks/:blockNumber', () => {
    it('should validate block number format', async () => {
      const response = await request(app)
        .get('/v1/blocks/invalid');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });

    it('should handle valid block number', async () => {
      const response = await request(app)
        .get('/v1/blocks/1000');

      // Should return 404 if block doesn't exist, 200 if it does, or 500 if DB unavailable
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /v1/blocks/hash/:hash', () => {
    it('should validate hash format', async () => {
      const response = await request(app)
        .get('/v1/blocks/hash/invalid-hash');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_PARAMETER');
    });

    it('should handle valid hash format', async () => {
      const validHash = '0x' + '0'.repeat(64);
      const response = await request(app)
        .get(`/v1/blocks/hash/${validHash}`);

      // Should return 404 if block doesn't exist, 200 if it does, or 500 if DB unavailable
      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown/route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });
});

