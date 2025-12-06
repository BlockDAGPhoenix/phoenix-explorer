import { IBlockService } from '../interfaces/services/IBlockService';
import { IBlockRepository } from '../interfaces/repositories/IBlockRepository';
import { Block } from '../domain/Block';

/**
 * Block Service Implementation
 * Follows ISP: Only implements IBlockService (read operations)
 */
export class BlockService implements IBlockService {
  constructor(private readonly repository: IBlockRepository) {}

  async getBlockByNumber(blockNumber: bigint): Promise<Block | null> {
    return await this.repository.getBlockByNumber(blockNumber);
  }

  async getBlockByHash(hash: string): Promise<Block | null> {
    // Validate hash format
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid block hash format');
    }

    return await this.repository.getBlockByHash(hash);
  }

  async getLatestBlocks(limit: number): Promise<Block[]> {
    // Validate limit
    if (limit < 1) {
      throw new Error('Limit must be at least 1');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return await this.repository.getLatestBlocks(limit);
  }

  private isValidHash(hash: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(hash);
  }
}

