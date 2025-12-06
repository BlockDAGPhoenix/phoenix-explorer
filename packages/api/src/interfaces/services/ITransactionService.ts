import { Transaction } from '../../domain/Transaction';

/**
 * Transaction Service Interface (ISP: Single responsibility)
 * Handles transaction retrieval operations
 */
export interface ITransactionService {
  getTransactionByHash(hash: string): Promise<Transaction | null>;
  getTransactionsByBlockHash(blockHash: string): Promise<Transaction[]>;
  getLatestTransactions(limit: number): Promise<Transaction[]>;
}

