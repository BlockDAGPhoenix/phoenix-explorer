import { ITransactionService } from '../interfaces/services/ITransactionService';
import { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository';
import { Transaction } from '../domain/Transaction';

/**
 * Transaction Service Implementation
 * Follows ISP: Only implements ITransactionService (read operations)
 */
export class TransactionService implements ITransactionService {
  constructor(private readonly repository: ITransactionRepository) {}

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    // Validate hash format
    if (!this.isValidHash(hash)) {
      throw new Error('Invalid transaction hash format');
    }

    return await this.repository.getTransactionByHash(hash);
  }

  async getTransactionsByBlockHash(blockHash: string): Promise<Transaction[]> {
    // Validate block hash format
    if (!this.isValidHash(blockHash)) {
      throw new Error('Invalid block hash format');
    }

    return await this.repository.getTransactionsByBlockHash(blockHash);
  }

  async getLatestTransactions(limit: number): Promise<Transaction[]> {
    // Validate limit
    if (limit < 1) {
      throw new Error('Limit must be at least 1');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return await this.repository.getLatestTransactions(limit);
  }

  private isValidHash(hash: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(hash);
  }
}

