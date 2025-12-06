import { Pool } from 'pg';
import { IStatisticsRepository } from '../interfaces/repositories/IStatisticsRepository';
import { BlockStatistics, NetworkStatistics, TimeSeriesPoint } from '../domain/Statistics';

/**
 * PostgreSQL Statistics Repository Implementation
 * Follows ISP: Only implements IStatisticsRepository (read operations)
 */
export class StatisticsRepository implements IStatisticsRepository {
  constructor(private readonly pool: Pool) {}

  async getBlockStatistics(
    from?: bigint,
    to?: bigint,
    granularity: 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<BlockStatistics> {
    try {
      // Get total blocks
      let totalBlocksQuery = 'SELECT COUNT(*)::bigint as count FROM blocks';
      const totalBlocksParams: any[] = [];

      if (from || to) {
        const conditions: string[] = [];
        if (from) {
          conditions.push(`timestamp >= $${totalBlocksParams.length + 1}`);
          totalBlocksParams.push(from.toString());
        }
        if (to) {
          conditions.push(`timestamp <= $${totalBlocksParams.length + 1}`);
          totalBlocksParams.push(to.toString());
        }
        if (conditions.length > 0) {
          totalBlocksQuery += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const totalBlocksResult = await this.pool.query(totalBlocksQuery, totalBlocksParams);
      const totalBlocks = BigInt(totalBlocksResult.rows[0]?.count || '0');

      // Get average block time
      let avgBlockTimeQuery = 'SELECT AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number)))) as avg FROM blocks';
      const avgBlockTimeParams: any[] = [];
      if (from || to) {
        const conditions: string[] = [];
        if (from) {
          conditions.push(`timestamp >= $${avgBlockTimeParams.length + 1}`);
          avgBlockTimeParams.push(from.toString());
        }
        if (to) {
          conditions.push(`timestamp <= $${avgBlockTimeParams.length + 1}`);
          avgBlockTimeParams.push(to.toString());
        }
        if (conditions.length > 0) {
          avgBlockTimeQuery += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const avgBlockTimeResult = await this.pool.query(avgBlockTimeQuery, avgBlockTimeParams);
      const avgBlockTime = parseFloat(avgBlockTimeResult.rows[0]?.avg || '0');

      // Get average gas used
      let avgGasUsedQuery = 'SELECT AVG(gas_used)::bigint as avg FROM blocks';
      const avgGasUsedParams: any[] = [];
      if (from || to) {
        const conditions: string[] = [];
        if (from) {
          conditions.push(`timestamp >= $${avgGasUsedParams.length + 1}`);
          avgGasUsedParams.push(from.toString());
        }
        if (to) {
          conditions.push(`timestamp <= $${avgGasUsedParams.length + 1}`);
          avgGasUsedParams.push(to.toString());
        }
        if (conditions.length > 0) {
          avgGasUsedQuery += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const avgGasUsedResult = await this.pool.query(avgGasUsedQuery, avgGasUsedParams);
      const avgGasUsed = BigInt(avgGasUsedResult.rows[0]?.avg || '0');

      // Get average transactions per block
      let avgTxPerBlockQuery = 'SELECT AVG(transaction_count) as avg FROM blocks';
      const avgTxPerBlockParams: any[] = [];
      if (from || to) {
        const conditions: string[] = [];
        if (from) {
          conditions.push(`timestamp >= $${avgTxPerBlockParams.length + 1}`);
          avgTxPerBlockParams.push(from.toString());
        }
        if (to) {
          conditions.push(`timestamp <= $${avgTxPerBlockParams.length + 1}`);
          avgTxPerBlockParams.push(to.toString());
        }
        if (conditions.length > 0) {
          avgTxPerBlockQuery += ' WHERE ' + conditions.join(' AND ');
        }
      }

      const avgTxPerBlockResult = await this.pool.query(avgTxPerBlockQuery, avgTxPerBlockParams);
      const avgTransactionsPerBlock = parseFloat(avgTxPerBlockResult.rows[0]?.avg || '0');

      // Get time series if time range provided
      let timeSeries: TimeSeriesPoint[] | undefined;
      if (from && to) {
        const interval = this.getIntervalForGranularity(granularity);
        const timeSeriesQuery = `
          SELECT 
            DATE_TRUNC($1, TO_TIMESTAMP(timestamp / 1000))::bigint * 1000 as timestamp,
            COUNT(*)::int as block_count,
            AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number)))) as avg_block_time
          FROM blocks
          WHERE timestamp >= $2 AND timestamp <= $3
          GROUP BY DATE_TRUNC($1, TO_TIMESTAMP(timestamp / 1000))
          ORDER BY timestamp ASC
        `;

        const timeSeriesResult = await this.pool.query(timeSeriesQuery, [
          interval,
          from.toString(),
          to.toString(),
        ]);

        timeSeries = timeSeriesResult.rows.map((row) => ({
          timestamp: BigInt(row.timestamp),
          blockCount: parseInt(row.block_count || '0', 10),
          avgBlockTime: parseFloat(row.avg_block_time || '0'),
        }));
      }

      return {
        totalBlocks,
        avgBlockTime,
        avgGasUsed,
        avgTransactionsPerBlock,
        timeSeries,
      };
    } catch (error) {
      throw new Error(`Failed to get block statistics: ${error}`);
    }
  }

  async getNetworkStatistics(): Promise<NetworkStatistics> {
    try {
      // Get total blocks
      const totalBlocksResult = await this.pool.query('SELECT COUNT(*)::bigint as count FROM blocks');
      const totalBlocks = BigInt(totalBlocksResult.rows[0]?.count || '0');

      // Get total transactions
      const totalTransactionsResult = await this.pool.query('SELECT COUNT(*)::bigint as count FROM transactions');
      const totalTransactions = BigInt(totalTransactionsResult.rows[0]?.count || '0');

      // Get total addresses
      const totalAddressesResult = await this.pool.query('SELECT COUNT(*)::bigint as count FROM addresses');
      const totalAddresses = BigInt(totalAddressesResult.rows[0]?.count || '0');

      // Get total contracts
      const totalContractsResult = await this.pool.query(
        'SELECT COUNT(*)::bigint as count FROM addresses WHERE is_contract = true'
      );
      const totalContracts = BigInt(totalContractsResult.rows[0]?.count || '0');

      // Get average block time
      const avgBlockTimeResult = await this.pool.query(
        'SELECT AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number)))) as avg FROM blocks'
      );
      const avgBlockTime = parseFloat(avgBlockTimeResult.rows[0]?.avg || '0');

      return {
        totalBlocks,
        totalTransactions,
        totalAddresses,
        totalContracts,
        avgBlockTime,
      };
    } catch (error) {
      throw new Error(`Failed to get network statistics: ${error}`);
    }
  }

  private getIntervalForGranularity(granularity: 'hour' | 'day' | 'week' | 'month'): string {
    switch (granularity) {
      case 'hour':
        return 'hour';
      case 'day':
        return 'day';
      case 'week':
        return 'week';
      case 'month':
        return 'month';
      default:
        return 'day';
    }
  }
}

