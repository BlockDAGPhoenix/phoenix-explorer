import { Pool } from 'pg';
import { IAddressRepository } from '../interfaces/repositories/IAddressRepository';
import { Address, Transaction } from '../domain';

/**
 * PostgreSQL Address Repository Implementation
 * Follows ISP: Only implements IAddressRepository (read operations)
 */
export class AddressRepository implements IAddressRepository {
  constructor(private readonly pool: Pool) {}

  async getAddress(address: string): Promise<Address | null> {
    const query = `
      SELECT address, balance, nonce, is_contract, contract_code,
             transaction_count, first_seen_at, last_seen_at
      FROM addresses
      WHERE address = $1
    `;

    try {
      const result = await this.pool.query(query, [address]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToAddress(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get address: ${error}`);
    }
  }

  async getAddressBalance(address: string): Promise<bigint> {
    const query = `
      SELECT balance
      FROM addresses
      WHERE address = $1
    `;

    try {
      const result = await this.pool.query(query, [address]);

      if (result.rows.length === 0) {
        return 0n;
      }

      return BigInt(result.rows[0].balance || '0');
    } catch (error) {
      throw new Error(`Failed to get address balance: ${error}`);
    }
  }

  async getAddressTransactions(
    address: string,
    limit: number,
    type: 'sent' | 'received' | 'all' = 'all'
  ): Promise<Transaction[]> {
    let query = `
      SELECT hash, block_hash, block_number, transaction_index,
             from_address, to_address, value, input_data, nonce,
             gas_limit, gas_price, gas_used, status,
             creates_contract, contract_address, timestamp
      FROM transactions
      WHERE
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (type === 'sent') {
      query += ` from_address = $${paramIndex}`;
      params.push(address);
      paramIndex++;
    } else if (type === 'received') {
      query += ` to_address = $${paramIndex}`;
      params.push(address);
      paramIndex++;
    } else {
      query += ` (from_address = $${paramIndex} OR to_address = $${paramIndex})`;
      params.push(address);
      paramIndex++;
    }

    query += ` ORDER BY block_number DESC, transaction_index ASC LIMIT $${paramIndex}`;
    params.push(limit);

    try {
      const result = await this.pool.query(query, params);

      return result.rows.map((row) => this.mapRowToTransaction(row));
    } catch (error) {
      throw new Error(`Failed to get address transactions: ${error}`);
    }
  }

  private mapRowToAddress(row: any): Address {
    return {
      address: row.address,
      balance: BigInt(row.balance || '0'),
      nonce: BigInt(row.nonce || '0'),
      isContract: row.is_contract || false,
      contractCode: row.contract_code || undefined,
      transactionCount: BigInt(row.transaction_count || '0'),
      firstSeenAt: row.first_seen_at ? BigInt(new Date(row.first_seen_at).getTime()) : undefined,
      lastSeenAt: row.last_seen_at ? BigInt(new Date(row.last_seen_at).getTime()) : undefined,
    };
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

