import { BlockStatistics, NetworkStatistics } from '../../domain/Statistics';

/**
 * Statistics Service Interface (ISP: Single responsibility)
 * Handles statistics retrieval operations
 */
export interface IStatisticsService {
  getBlockStatistics(from?: bigint, to?: bigint, granularity?: 'hour' | 'day' | 'week' | 'month'): Promise<BlockStatistics>;
  getNetworkStatistics(): Promise<NetworkStatistics>;
}

