import { ISearchService } from '../interfaces/services/ISearchService';
import { IBlockRepository } from '../interfaces/repositories/IBlockRepository';
import { ITransactionRepository } from '../interfaces/repositories/ITransactionRepository';
import { IAddressRepository } from '../interfaces/repositories/IAddressRepository';
import { SearchResult } from '../domain/Search';

/**
 * Search Service Implementation
 * Follows ISP: Only implements ISearchService (search operations)
 */
export class SearchService implements ISearchService {
  constructor(
    private readonly blockRepository: IBlockRepository,
    private readonly transactionRepository: ITransactionRepository,
    private readonly addressRepository: IAddressRepository
  ) {}

  async search(query: string): Promise<SearchResult[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const trimmedQuery = query.trim();
    const results: SearchResult[] = [];

    // Try to identify query type and search accordingly
    // Address (40 hex chars after 0x)
    if (this.isAddress(trimmedQuery)) {
      const address = await this.addressRepository.getAddress(trimmedQuery);
      if (address) {
        results.push({
          type: 'address',
          address: address.address,
          isContract: address.isContract,
        });
      }
    }

    // Transaction hash (64 hex chars after 0x)
    if (this.isTransactionHash(trimmedQuery)) {
      const transaction = await this.transactionRepository.getTransactionByHash(trimmedQuery);
      if (transaction) {
        results.push({
          type: 'transaction',
          hash: transaction.hash,
        });
      }
    }

    // Block hash (64 hex chars after 0x)
    if (this.isBlockHash(trimmedQuery)) {
      const block = await this.blockRepository.getBlockByHash(trimmedQuery);
      if (block) {
        results.push({
          type: 'block',
          hash: block.hash,
          blockNumber: block.number,
        });
      }
    }

    // Block number (numeric)
    if (this.isBlockNumber(trimmedQuery)) {
      const blockNumber = BigInt(trimmedQuery);
      const block = await this.blockRepository.getBlockByNumber(blockNumber);
      if (block) {
        results.push({
          type: 'block',
          hash: block.hash,
          blockNumber: block.number,
        });
      }
    }

    return results;
  }

  private isAddress(query: string): boolean {
    const addressRegex = /^0x[0-9a-fA-F]{40}$/;
    return addressRegex.test(query);
  }

  private isTransactionHash(query: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(query) && !this.isAddress(query);
  }

  private isBlockHash(query: string): boolean {
    const hashRegex = /^0x[0-9a-fA-F]{64}$/;
    return hashRegex.test(query);
  }

  private isBlockNumber(query: string): boolean {
    return /^\d+$/.test(query);
  }
}

