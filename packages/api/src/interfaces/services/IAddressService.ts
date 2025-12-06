import { Address } from '../../domain/Address';
import { Transaction } from '../../domain/Transaction';

/**
 * Address Service Interface (ISP: Single responsibility)
 * Handles address retrieval operations
 */
export interface IAddressService {
  getAddress(address: string): Promise<Address | null>;
  getAddressBalance(address: string): Promise<bigint>;
  getAddressTransactions(address: string, limit: number, type?: 'sent' | 'received' | 'all'): Promise<Transaction[]>;
}

