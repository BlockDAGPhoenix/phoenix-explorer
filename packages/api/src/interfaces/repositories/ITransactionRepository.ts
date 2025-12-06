import { Transaction } from '../../domain/Transaction';

/**
 * Transaction Repository Interface (ISP: Read operations only)
 */
export interface ITransactionRepository {
  getTransactionByHash(hash: string): Promise<Transaction | null>;
  getTransactionsByBlockHash(blockHash: string): Promise<Transaction[]>;
  getLatestTransactions(limit: number): Promise<Transaction[]>;
}

