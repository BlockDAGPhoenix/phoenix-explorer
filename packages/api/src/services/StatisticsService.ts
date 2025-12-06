import { IStatisticsService } from '../interfaces/services/IStatisticsService';
import { IStatisticsRepository } from '../interfaces/repositories/IStatisticsRepository';
import { BlockStatistics, NetworkStatistics } from '../domain/Statistics';

/**
 * Statistics Service Implementation
 * Follows ISP: Only implements IStatisticsService (read operations)
 */
export class StatisticsService implements IStatisticsService {
  constructor(private readonly repository: IStatisticsRepository) {}

  async getBlockStatistics(
    from?: bigint,
    to?: bigint,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<BlockStatistics> {
    // Validate granularity
    const validGranularities = ['hour', 'day', 'week', 'month'];
    if (!validGranularities.includes(granularity)) {
      throw new Error('Invalid granularity. Must be hour, day, week, or month');
    }

    // Validate time range if both provided
    if (from && to && from >= to) {
      throw new Error('Invalid time range: from must be less than to');
    }

    return await this.repository.getBlockStatistics(from, to, granularity);
  }

  async getNetworkStatistics(): Promise<NetworkStatistics> {
    return await this.repository.getNetworkStatistics();
  }
}

