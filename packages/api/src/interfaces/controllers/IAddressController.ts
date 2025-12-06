import { Request, Response } from 'express';

/**
 * Address Controller Interface (ISP: HTTP operations only)
 */
export interface IAddressController {
  getAddress(req: Request, res: Response): Promise<void>;
  getAddressBalance(req: Request, res: Response): Promise<void>;
  getAddressTransactions(req: Request, res: Response): Promise<void>;
}

