import { Request, Response } from 'express';

/**
 * Statistics Controller Interface (ISP: HTTP operations only)
 */
export interface IStatisticsController {
  getBlockStatistics(req: Request, res: Response): Promise<void>;
  getNetworkStatistics(req: Request, res: Response): Promise<void>;
}

