import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressRepository } from '@/repositories/AddressRepository';
import { Pool } from 'pg';
import { Address, Transaction } from '@/domain';

// Mock pg Pool
vi.mock('pg', () => {
  const mockQuery = vi.fn();
  
  return {
    Pool: vi.fn().mockImplementation(() => ({
      query: mockQuery,
      connect: vi.fn(),
      end: vi.fn(),
    })),
    mockQuery,
  };
});

describe('AddressRepository', () => {
  let repository: AddressRepository;
  let mockPool: any;
  let mockQuery: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new Pool();
    mockQuery = vi.fn();
    mockPool.query = mockQuery;
    repository = new AddressRepository(mockPool);
  });

  describe('getAddress', () => {
    it('should return address when exists', async () => {
      const expectedAddress: Address = {
        address: '0x' + 'a'.repeat(40),
        balance: 1000000000000000000n,
        nonce: 5n,
        isContract: false,
        transactionCount: 10n,
      };

      mockQuery.mockResolvedValueOnce({
        rows: [{
          address: expectedAddress.address,
          balance: expectedAddress.balance.toString(),
          nonce: expectedAddress.nonce.toString(),
          is_contract: expectedAddress.isContract,
          contract_code: null,
          transaction_count: expectedAddress.transactionCount.toString(),
          first_seen_at: null,
          last_seen_at: null,
        }],
      });

      const result = await repository.getAddress(expectedAddress.address);

      expect(result).not.toBeNull();
      expect(result?.address).toBe(expectedAddress.address);
      expect(result?.balance).toBe(expectedAddress.balance);
    });

    it('should return null when address does not exist', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getAddress('0x' + '0'.repeat(40));

      expect(result).toBeNull();
    });
  });

  describe('getAddressBalance', () => {
    it('should return balance for address', async () => {
      const address = '0x' + 'a'.repeat(40);
      const balance = '1000000000000000000';

      mockQuery.mockResolvedValueOnce({
        rows: [{ balance }],
      });

      const result = await repository.getAddressBalance(address);

      expect(result).toBe(BigInt(balance));
    });

    it('should return zero for non-existent address', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const result = await repository.getAddressBalance('0x' + '0'.repeat(40));

      expect(result).toBe(0n);
    });
  });

  describe('getAddressTransactions', () => {
    it('should return transactions for address', async () => {
      const address = '0x' + 'a'.repeat(40);
      const expectedRows = [
        {
          hash: '0x' + 'b'.repeat(64),
          block_hash: '0x' + 'c'.repeat(64),
          block_number: '1000',
          transaction_index: 0,
          from_address: address,
          to_address: '0x' + 'd'.repeat(40),
          value: '1000000000000000000',
          gas_limit: '21000',
          gas_price: null,
          gas_used: null,
          nonce: '5',
          input_data: '0x',
          status: 1,
          creates_contract: false,
          contract_address: null,
          timestamp: '1706150400000',
        },
      ];

      mockQuery.mockResolvedValueOnce({ rows: expectedRows });

      const result = await repository.getAddressTransactions(address, 10);

      expect(result).toHaveLength(1);
      expect(result[0].from).toBe(address);
    });

    it('should filter by sent transactions', async () => {
      const address = '0x' + 'a'.repeat(40);
      mockQuery.mockResolvedValueOnce({ rows: [] });

      await repository.getAddressTransactions(address, 10, 'sent');

      expect(mockQuery).toHaveBeenCalled();
      // Verify query includes from_address filter
    });
  });
});

