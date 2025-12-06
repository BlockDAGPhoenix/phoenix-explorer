import { DAGInfo } from '../../domain/DAG';

/**
 * DAG Service Interface (ISP: Single responsibility)
 * Handles DAG retrieval operations
 */
export interface IDAGService {
  getBlockDAGInfo(blockNumber: bigint, depth?: number): Promise<DAGInfo | null>;
  getBlockParents(blockHash: string): Promise<string[]>;
  getBlockChildren(blockHash: string): Promise<string[]>;
}

