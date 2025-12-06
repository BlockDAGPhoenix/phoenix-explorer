/**
 * Statistics Domain Models
 */
export interface BlockStatistics {
  totalBlocks: bigint;
  avgBlockTime: number;
  avgGasUsed: bigint;
  avgTransactionsPerBlock: number;
  timeSeries?: TimeSeriesPoint[];
}

export interface TimeSeriesPoint {
  timestamp: bigint;
  blockCount: number;
  avgBlockTime: number;
}

export interface NetworkStatistics {
  totalBlocks: bigint;
  totalTransactions: bigint;
  totalAddresses: bigint;
  totalContracts: bigint;
  avgBlockTime: number;
  networkHashRate?: bigint;
  difficulty?: bigint;
}

