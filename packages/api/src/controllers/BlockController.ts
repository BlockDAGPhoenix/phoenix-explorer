import { Request, Response } from 'express';
import { IBlockController } from '../interfaces/controllers/IBlockController';
import { IBlockService } from '../interfaces/services/IBlockService';

/**
 * Block Controller Implementation
 * Follows ISP: Only implements IBlockController (HTTP operations)
 */
export class BlockController implements IBlockController {
  constructor(private readonly blockService: IBlockService) {}

  async getLatestBlocks(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const blocks = await this.blockService.getLatestBlocks(limit);

      res.status(200).json({
        success: true,
        data: { blocks },
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

  async getBlockByNumber(req: Request, res: Response): Promise<void> {
    try {
      const blockNumberStr = req.params.blockNumber;

      // Validate block number format
      if (!/^\d+$/.test(blockNumberStr)) {
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

      const block = await this.blockService.getBlockByNumber(blockNumber);

      if (!block) {
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
        data: block,
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

  async getBlockByHash(req: Request, res: Response): Promise<void> {
    try {
      const hash = req.params.hash;

      // Validate hash format
      if (!this.isValidHash(hash)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid block hash format',
          },
        });
        return;
      }

      const block = await this.blockService.getBlockByHash(hash);

      if (!block) {
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
        data: block,
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

