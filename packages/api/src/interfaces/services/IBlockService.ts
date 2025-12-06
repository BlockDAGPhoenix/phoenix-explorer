import { Block, GHOSTDAGData } from '../../domain/Block';

/**
 * Block Service Interface (ISP: Single responsibility)
 * Handles block retrieval operations
 */
export interface IBlockService {
  getBlockByNumber(blockNumber: bigint): Promise<Block | null>;
  getBlockByHash(hash: string): Promise<Block | null>;
  getLatestBlocks(limit: number): Promise<Block[]>;
}

/**
 * Block Statistics Service Interface (ISP: Statistics only)
 * Handles block statistics operations
 */
export interface IBlockStatisticsService {
  getBlockCount(): Promise<number>;
  getAverageBlockTime(): Promise<number>;
  getBlocksPerDay(): Promise<number>;
}

/**
 * Block DAG Service Interface (ISP: DAG operations only)
 * Handles DAG-specific operations
 */
export interface IBlockDAGService {
  getBlockParents(blockHash: string): Promise<string[]>;
  getBlockChildren(blockHash: string): Promise<string[]>;
  getGHOSTDAGData(blockHash: string): Promise<GHOSTDAGData | null>;
}

