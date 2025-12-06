import { Pool } from 'pg';
import { IBlockRepository } from '../interfaces/repositories/IBlockRepository';
import { Block } from '../domain/Block';

/**
 * PostgreSQL Block Repository Implementation
 * Follows ISP: Only implements IBlockRepository (read operations)
 */
export class BlockRepository implements IBlockRepository {
  constructor(private readonly pool: Pool) {}

  async getBlockByNumber(blockNumber: bigint): Promise<Block | null> {
    const query = `
      SELECT hash, number, parent_hashes, timestamp, miner_address,
             gas_limit, gas_used, base_fee_per_gas, blue_score,
             is_chain_block, selected_parent_hash, transactions_root,
             state_root, receipts_root, transaction_count
      FROM blocks
      WHERE number = $1
      ORDER BY blue_score DESC
      LIMIT 1
    `;

    try {
      const result = await this.pool.query(query, [blockNumber.toString()]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBlock(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get block by number: ${error}`);
    }
  }

  async getBlockByHash(hash: string): Promise<Block | null> {
    const query = `
      SELECT hash, number, parent_hashes, timestamp, miner_address,
             gas_limit, gas_used, base_fee_per_gas, blue_score,
             is_chain_block, selected_parent_hash, transactions_root,
             state_root, receipts_root, transaction_count
      FROM blocks
      WHERE hash = $1
    `;

    try {
      const result = await this.pool.query(query, [hash]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToBlock(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get block by hash: ${error}`);
    }
  }

  async getLatestBlocks(limit: number): Promise<Block[]> {
    const query = `
      SELECT hash, number, parent_hashes, timestamp, miner_address,
             gas_limit, gas_used, base_fee_per_gas, blue_score,
             is_chain_block, selected_parent_hash, transactions_root,
             state_root, receipts_root, transaction_count
      FROM blocks
      ORDER BY number DESC, blue_score DESC
      LIMIT $1
    `;

    try {
      const result = await this.pool.query(query, [limit]);

      return result.rows.map((row) => this.mapRowToBlock(row));
    } catch (error) {
      throw new Error(`Failed to get latest blocks: ${error}`);
    }
  }

  private mapRowToBlock(row: any): Block {
    return {
      hash: row.hash,
      number: BigInt(row.number),
      parentHashes: row.parent_hashes || [],
      timestamp: BigInt(row.timestamp),
      miner: row.miner_address || '',
      gasLimit: BigInt(row.gas_limit),
      gasUsed: BigInt(row.gas_used),
      baseFeePerGas: row.base_fee_per_gas ? BigInt(row.base_fee_per_gas) : undefined,
      blueScore: BigInt(row.blue_score),
      isChainBlock: row.is_chain_block ?? true,
      selectedParent: row.selected_parent_hash || undefined,
      transactionsRoot: row.transactions_root || undefined,
      stateRoot: row.state_root || undefined,
      receiptsRoot: row.receipts_root || undefined,
      transactionCount: row.transaction_count || 0,
    };
  }
}

