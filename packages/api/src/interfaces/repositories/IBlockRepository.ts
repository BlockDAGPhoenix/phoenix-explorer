import { Block, GHOSTDAGData } from '../../domain/Block';

/**
 * Block Repository Interface (ISP: Read operations only)
 */
export interface IBlockRepository {
  getBlockByNumber(blockNumber: bigint): Promise<Block | null>;
  getBlockByHash(hash: string): Promise<Block | null>;
  getLatestBlocks(limit: number): Promise<Block[]>;
}

/**
 * Block Statistics Repository Interface (ISP: Statistics only)
 */
export interface IBlockStatisticsRepository {
  getBlockCount(): Promise<number>;
  getAverageBlockTime(): Promise<number>;
}

/**
 * Block DAG Repository Interface (ISP: DAG read operations only)
 */
export interface IBlockDAGRepository {
  getBlockParents(blockHash: string): Promise<string[]>;
  getBlockChildren(blockHash: string): Promise<string[]>;
  getGHOSTDAGData(blockHash: string): Promise<GHOSTDAGData | null>;
}

