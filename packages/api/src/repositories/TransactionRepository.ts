import { Pool } from 'pg';
import { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository';
import { Transaction } from '../domain/Transaction';

/**
 * PostgreSQL Transaction Repository Implementation
 * Follows ISP: Only implements ITransactionRepository (read operations)
 */
export class TransactionRepository implements ITransactionRepository {
  constructor(private readonly pool: Pool) {}

  async getTransactionByHash(hash: string): Promise<Transaction | null> {
    const query = `
      SELECT hash, block_hash, block_number, transaction_index,
             from_address, to_address, value, input_data, nonce,
             gas_limit, gas_price, gas_used, status,
             creates_contract, contract_address, timestamp
      FROM transactions
      WHERE hash = $1
    `;

    try {
      const result = await this.pool.query(query, [hash]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToTransaction(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get transaction by hash: ${error}`);
    }
  }

  async getTransactionsByBlockHash(blockHash: string): Promise<Transaction[]> {
    const query = `
      SELECT hash, block_hash, block_number, transaction_index,
             from_address, to_address, value, input_data, nonce,
             gas_limit, gas_price, gas_used, status,
             creates_contract, contract_address, timestamp
      FROM transactions
      WHERE block_hash = $1
      ORDER BY transaction_index ASC
    `;

    try {
      const result = await this.pool.query(query, [blockHash]);

      return result.rows.map((row) => this.mapRowToTransaction(row));
    } catch (error) {
      throw new Error(`Failed to get transactions by block hash: ${error}`);
    }
  }

  async getLatestTransactions(limit: number): Promise<Transaction[]> {
    const query = `
      SELECT hash, block_hash, block_number, transaction_index,
             from_address, to_address, value, input_data, nonce,
             gas_limit, gas_price, gas_used, status,
             creates_contract, contract_address, timestamp
      FROM transactions
      ORDER BY block_number DESC, transaction_index ASC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);

      return result.rows.map((row) => this.mapRowToTransaction(row));
    } catch (error) {
      throw new Error(`Failed to get latest transactions: ${error}`);
    }
  }

  private mapRowToTransaction(row: any): Transaction {
    return {
      hash: row.hash,
      blockHash: row.block_hash,
      blockNumber: BigInt(row.block_number),
      transactionIndex: row.transaction_index,
      from: row.from_address,
      to: row.to_address || undefined,
      value: BigInt(row.value || '0'),
      gasLimit: BigInt(row.gas_limit),
      gasPrice: row.gas_price ? BigInt(row.gas_price) : undefined,
      gasUsed: row.gas_used ? BigInt(row.gas_used) : undefined,
      nonce: BigInt(row.nonce),
      input: row.input_data || '0x',
      status: row.status !== null ? row.status : undefined,
      createsContract: row.creates_contract || false,
      contractAddress: row.contract_address || undefined,
      timestamp: row.timestamp ? BigInt(row.timestamp) : undefined,
    };
  }
}

