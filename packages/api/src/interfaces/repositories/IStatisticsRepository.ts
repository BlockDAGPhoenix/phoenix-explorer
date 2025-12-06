import { BlockStatistics, NetworkStatistics } from '../../domain/Statistics';

/**
 * Statistics Repository Interface (ISP: Read operations only)
 */
export interface IStatisticsRepository {
  getBlockStatistics(from?: bigint, to?: bigint, granularity?: 'hour' | 'day' | 'week' | 'month'): Promise<BlockStatistics>;
  getNetworkStatistics(): Promise<NetworkStatistics>;
}

