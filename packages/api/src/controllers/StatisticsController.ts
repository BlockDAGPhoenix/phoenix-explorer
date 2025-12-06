import { Request, Response } from 'express';
import { IStatisticsController } from '../interfaces/controllers/IStatisticsController';
import { IStatisticsService } from '../interfaces/services/IStatisticsService';

/**
 * Statistics Controller Implementation
 * Follows ISP: Only implements IStatisticsController (HTTP operations)
 */
export class StatisticsController implements IStatisticsController {
  constructor(private readonly statisticsService: IStatisticsService) {}

  async getBlockStatistics(req: Request, res: Response): Promise<void> {
    try {
      const fromStr = req.query.from as string;
      const toStr = req.query.to as string;
      const granularity = (req.query.granularity as 'hour' | 'day' | 'week' | 'month') || 'day';

      const from = fromStr ? BigInt(fromStr) : undefined;
      const to = toStr ? BigInt(toStr) : undefined;

      const statistics = await this.statisticsService.getBlockStatistics(from, to, granularity);

      res.status(200).json({
        success: true,
        data: statistics,
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

  async getNetworkStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.statisticsService.getNetworkStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
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
}

