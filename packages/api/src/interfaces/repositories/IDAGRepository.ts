import { DAGBlock, GHOSTDAGData } from '../../domain/DAG';

/**
 * DAG Repository Interface (ISP: Read operations only)
 */
export interface IDAGRepository {
  getBlockParents(blockHash: string): Promise<DAGBlock[]>;
  getBlockChildren(blockHash: string): Promise<DAGBlock[]>;
  getGHOSTDAGData(blockHash: string): Promise<GHOSTDAGData | null>;
  getBlockByHash(blockHash: string): Promise<DAGBlock | null>;
}

