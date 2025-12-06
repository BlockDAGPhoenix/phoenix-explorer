import { Request, Response } from 'express';
import { ITransactionController } from '../interfaces/controllers/ITransactionController';
import { ITransactionService } from '../interfaces/services/ITransactionService';

/**
 * Transaction Controller Implementation
 * Follows ISP: Only implements ITransactionController (HTTP operations)
 */
export class TransactionController implements ITransactionController {
  constructor(private readonly transactionService: ITransactionService) {}

  async getTransactionByHash(req: Request, res: Response): Promise<void> {
    try {
      const hash = req.params.hash;

      // Validate hash format
      if (!this.isValidHash(hash)) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_PARAMETER',
            message: 'Invalid transaction hash format',
          },
        });
        return;
      }

      const transaction = await this.transactionService.getTransactionByHash(hash);

      if (!transaction) {
        res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Transaction not found',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: transaction,
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

  async getTransactionsByBlockHash(req: Request, res: Response): Promise<void> {
    try {
      const blockHash = req.params.blockHash;

      // Validate block hash format
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

      const transactions = await this.transactionService.getTransactionsByBlockHash(blockHash);

      res.status(200).json({
        success: true,
        data: { transactions },
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

  async getLatestTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const transactions = await this.transactionService.getLatestTransactions(limit);

      res.status(200).json({
        success: true,
        data: { transactions },
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

