import { Pool } from 'pg';
import { IDAGRepository } from '../interfaces/repositories/IDAGRepository';
import { DAGBlock, GHOSTDAGData } from '../domain/DAG';

/**
 * PostgreSQL DAG Repository Implementation
 * Follows ISP: Only implements IDAGRepository (read operations)
 */
export class DAGRepository implements IDAGRepository {
  constructor(private readonly pool: Pool) {}

  async getBlockParents(blockHash: string): Promise<DAGBlock[]> {
    const query = `
      SELECT 
        b.hash,
        b.number,
        b.blue_score,
        dr.is_selected_parent
      FROM dag_relationships dr
      JOIN blocks b ON b.hash = dr.parent_hash
      WHERE dr.child_hash = $1
      ORDER BY b.blue_score DESC
    `;

    try {
      const result = await this.pool.query(query, [blockHash]);
      return result.rows.map((row) => this.mapRowToDAGBlock(row));
    } catch (error) {
      throw new Error(`Failed to get block parents: ${error}`);
    }
  }

  async getBlockChildren(blockHash: string): Promise<DAGBlock[]> {
    const query = `
      SELECT 
        b.hash,
        b.number,
        b.blue_score
      FROM dag_relationships dr
      JOIN blocks b ON b.hash = dr.child_hash
      WHERE dr.parent_hash = $1
      ORDER BY b.blue_score ASC
    `;

    try {
      const result = await this.pool.query(query, [blockHash]);
      return result.rows.map((row) => this.mapRowToDAGBlock(row));
    } catch (error) {
      throw new Error(`Failed to get block children: ${error}`);
    }
  }

  async getGHOSTDAGData(blockHash: string): Promise<GHOSTDAGData | null> {
    const query = `
      SELECT 
        blue_score,
        blue_work,
        merge_set_blues,
        merge_set_reds
      FROM ghostdag_data
      WHERE block_hash = $1
    `;

    try {
      const result = await this.pool.query(query, [blockHash]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToGHOSTDAGData(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get GHOSTDAG data: ${error}`);
    }
  }

  async getBlockByHash(blockHash: string): Promise<DAGBlock | null> {
    const query = `
      SELECT hash, number, blue_score
      FROM blocks
      WHERE hash = $1
    `;

    try {
      const result = await this.pool.query(query, [blockHash]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToDAGBlock(result.rows[0]);
    } catch (error) {
      throw new Error(`Failed to get block by hash: ${error}`);
    }
  }

  private mapRowToDAGBlock(row: any): DAGBlock {
    return {
      hash: row.hash,
      number: BigInt(row.number),
      blueScore: BigInt(row.blue_score || '0'),
      isSelectedParent: row.is_selected_parent || false,
    };
  }

  private mapRowToGHOSTDAGData(row: any): GHOSTDAGData {
    return {
      blueScore: BigInt(row.blue_score || '0'),
      blueWork: BigInt(row.blue_work || '0'),
      mergeSetBlues: row.merge_set_blues || [],
      mergeSetReds: row.merge_set_reds || [],
    };
  }
}

