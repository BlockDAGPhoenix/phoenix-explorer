import { IDAGService } from '../interfaces/services/IDAGService';
import { IDAGRepository } from '../interfaces/repositories/IDAGRepository';
import { IBlockRepository } from '../interfaces/repositories/IBlockRepository';
import { DAGInfo, DAGRelationship } from '../domain/DAG';

/**
 * DAG Service Implementation
 * Follows ISP: Only implements IDAGService (read operations)
 */
export class DAGService implements IDAGService {
  constructor(
    private readonly dagRepository: IDAGRepository,
    private readonly blockRepository: IBlockRepository
  ) {}

  async getBlockDAGInfo(blockNumber: bigint, depth: number = 1): Promise<DAGInfo | null> {
    // Validate depth
    if (depth < 1) {
      throw new Error('Depth must be at least 1');
    }
    if (depth > 10) {
      depth = 10; // Cap at maximum
    }

    // Get block by number
    const block = await this.blockRepository.getBlockByNumber(blockNumber);
    if (!block) {
      return null;
    }

    const blockHash = block.hash;

    // Get block details
    const blockDetails = await this.dagRepository.getBlockByHash(blockHash);
    if (!blockDetails) {
      return null;
    }

    // Get parents and children
    const parents = await this.dagRepository.getBlockParents(blockHash);
    const children = await this.dagRepository.getBlockChildren(blockHash);

    // Get GHOSTDAG data
    const ghostdagData = await this.dagRepository.getGHOSTDAGData(blockHash);

    // Build relationships
    const relationships: DAGRelationship[] = [
      ...parents.map((parent) => ({
        parent: parent.hash,
        child: blockHash,
        isSelectedParent: parent.isSelectedParent || false,
      })),
      ...children.map((child) => ({
        parent: blockHash,
        child: child.hash,
        isSelectedParent: false,
      })),
    ];

    return {
      block: {
        hash: blockDetails.hash,
        number: blockDetails.number,
        blueScore: blockDetails.blueScore,
      },
      parents,
      children,
      ghostdagData: ghostdagData || undefined,
      relationships,
    };
  }

  async getBlockParents(blockHash: string): Promise<string[]> {
    // Validate hash format
    if (!this.isValidHash(blockHash)) {
      throw new Error('Invalid block hash format');
    }

    const parents = await this.dagRepository.getBlockParents(blockHash);
    return parents.map((p) => p.hash);
  }

  async getBlockChildren(blockHash: string): Promise<string[]> {
    // Validate hash format
    if (!this.isValidHash(blockHash)) {
      throw new Error('Invalid block hash format');
    }

    const children = await this.dagRepository.getBlockChildren(blockHash);
    return children.map((c) => c.hash);
  }

  private isValidHash(hash: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(hash);
  }
}

