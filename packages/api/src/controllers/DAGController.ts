import { Request, Response } from 'express';
import { IDAGController } from '../interfaces/controllers/IDAGController';
import { IDAGService } from '../interfaces/services/IDAGService';

/**
 * DAG Controller Implementation
 * Follows ISP: Only implements IDAGController (HTTP operations)
 */
export class DAGController implements IDAGController {
  constructor(private readonly dagService: IDAGService) {}

  async getBlockDAGInfo(req: Request, res: Response): Promise<void> {
    try {
      const blockNumberStr = req.params.blockNumber;
      const depthStr = req.query.depth as string;

      // Validate block number
      if (!blockNumberStr || !/^\d+$/.test(blockNumberStr)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid block number format',
          },
        });
        return;
      }

      const blockNumber = BigInt(blockNumberStr);
      const depth = depthStr ? parseInt(depthStr, 10) : 1;

      const dagInfo = await this.dagService.getBlockDAGInfo(blockNumber, depth);

      if (!dagInfo) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Block not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: dagInfo,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      });
    }
  }

  async getBlockParents(req: Request, res: Response): Promise<void> {
    try {
      const blockHash = req.params.blockHash;

      // Validate hash format
      if (!this.isValidHash(blockHash)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid block hash format',
          },
        });
        return;
      }

      const parents = await this.dagService.getBlockParents(blockHash);

      res.status(200).json({
        success: true,
        data: { parents },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      });
    }
  }

  async getBlockChildren(req: Request, res: Response): Promise<void> {
    try {
      const blockHash = req.params.blockHash;

      // Validate hash format
      if (!this.isValidHash(blockHash)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid block hash format',
          },
        });
        return;
      }

      const children = await this.dagService.getBlockChildren(blockHash);

      res.status(200).json({
        success: true,
        data: { children },
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error.message || 'Internal server error',
        },
      });
    }
  }

  private isValidHash(hash: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(hash);
  }
}

