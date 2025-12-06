import { Address } from '../../domain/Address';
import { Transaction } from '../../domain/Transaction';

/**
 * Address Repository Interface (ISP: Read operations only)
 */
export interface IAddressRepository {
  getAddress(address: string): Promise<Address | null>;
  getAddressBalance(address: string): Promise<bigint>;
  getAddressTransactions(address: string, limit: number, type?: 'sent' | 'received' | 'all'): Promise<Transaction[]>;
}

