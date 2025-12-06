import { Request, Response } from 'express';

/**
 * Block Controller Interface (ISP: HTTP operations only)
 */
export interface IBlockController {
  getLatestBlocks(req: Request, res: Response): Promise<void>;
  getBlockByNumber(req: Request, res: Response): Promise<void>;
  getBlockByHash(req: Request, res: Response): Promise<void>;
}

