import { Request, Response } from 'express';

/**
 * Transaction Controller Interface (ISP: HTTP operations only)
 */
export interface ITransactionController {
  getTransactionByHash(req: Request, res: Response): Promise<void>;
  getTransactionsByBlockHash(req: Request, res: Response): Promise<void>;
  getLatestTransactions(req: Request, res: Response): Promise<void>;
}

