import { IAddressService } from '../interfaces/services/IAddressService';
import { IAddressRepository } from '../interfaces/repositories/IAddressRepository';
import { Address, Transaction } from '../domain';

/**
 * Address Service Implementation
 * Follows ISP: Only implements IAddressService (read operations)
 */
export class AddressService implements IAddressService {
  constructor(private readonly repository: IAddressRepository) {}

  async getAddress(address: string): Promise<Address | null> {
    // Validate address format
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid address format');
    }

    return await this.repository.getAddress(address);
  }

  async getAddressBalance(address: string): Promise<bigint> {
    // Validate address format
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid address format');
    }

    return await this.repository.getAddressBalance(address);
  }

  async getAddressTransactions(
    address: string,
    limit: number,
    type: 'sent' | 'received' | 'all' = 'all'
  ): Promise<Transaction[]> {
    // Validate address format
    if (!this.isValidAddress(address)) {
      throw new Error('Invalid address format');
    }

    // Validate limit
    if (limit < 1) {
      throw new Error('Limit must be at least 1');
    }
    if (limit > 100) {
      throw new Error('Limit cannot exceed 100');
    }

    return await this.repository.getAddressTransactions(address, limit, type);
  }

  private isValidAddress(address: string): boolean {
    const addressRegex = /^0x[0-9a-fA-F]{40}$/;
    return addressRegex.test(address);
  }
}

