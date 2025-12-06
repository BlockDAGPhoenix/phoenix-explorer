import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AddressService } from '@/services/AddressService';
import { IAddressRepository } from '@/interfaces/repositories/IAddressRepository';
import { Address, Transaction } from '@/domain';

describe('AddressService', () => {
  let service: AddressService;
  let mockRepository: IAddressRepository;

  beforeEach(() => {
    mockRepository = {
      getAddress: vi.fn(),
      getAddressBalance: vi.fn(),
      getAddressTransactions: vi.fn(),
    };
    service = new AddressService(mockRepository);
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

      vi.mocked(mockRepository.getAddress).mockResolvedValue(expectedAddress);

      const result = await service.getAddress(expectedAddress.address);

      expect(result).toEqual(expectedAddress);
      expect(mockRepository.getAddress).toHaveBeenCalledWith(expectedAddress.address);
    });

    it('should return null when address does not exist', async () => {
      const address = '0x' + '0'.repeat(40);
      vi.mocked(mockRepository.getAddress).mockResolvedValue(null);

      const result = await service.getAddress(address);

      expect(result).toBeNull();
    });

    it('should validate address format', async () => {
      const invalidAddress = 'invalid-address';

      await expect(service.getAddress(invalidAddress)).rejects.toThrow(
        'Invalid address format'
      );
    });
  });

  describe('getAddressBalance', () => {
    it('should return balance for address', async () => {
      const address = '0x' + 'a'.repeat(40);
      const expectedBalance = 1000000000000000000n;

      vi.mocked(mockRepository.getAddressBalance).mockResolvedValue(expectedBalance);

      const result = await service.getAddressBalance(address);

      expect(result).toBe(expectedBalance);
      expect(mockRepository.getAddressBalance).toHaveBeenCalledWith(address);
    });

    it('should return zero balance for non-existent address', async () => {
      const address = '0x' + '0'.repeat(40);
      vi.mocked(mockRepository.getAddressBalance).mockResolvedValue(0n);

      const result = await service.getAddressBalance(address);

      expect(result).toBe(0n);
    });
  });

  describe('getAddressTransactions', () => {
    it('should return transactions for address', async () => {
      const address = '0x' + 'a'.repeat(40);
      const expectedTxs: Transaction[] = [
        {
          hash: '0x' + 'b'.repeat(64),
          blockHash: '0x' + 'c'.repeat(64),
          blockNumber: 1000n,
          transactionIndex: 0,
          from: address,
          to: '0x' + 'd'.repeat(40),
          value: 1000000000000000000n,
          gasLimit: 21000n,
          nonce: 5n,
          input: '0x',
          status: 1,
          createsContract: false,
        },
      ];

      vi.mocked(mockRepository.getAddressTransactions).mockResolvedValue(expectedTxs);

      const result = await service.getAddressTransactions(address, 10);

      expect(result).toEqual(expectedTxs);
      expect(mockRepository.getAddressTransactions).toHaveBeenCalledWith(address, 10, 'all');
    });

    it('should filter by transaction type', async () => {
      const address = '0x' + 'a'.repeat(40);
      vi.mocked(mockRepository.getAddressTransactions).mockResolvedValue([]);

      await service.getAddressTransactions(address, 10, 'sent');

      expect(mockRepository.getAddressTransactions).toHaveBeenCalledWith(address, 10, 'sent');
    });

    it('should enforce maximum limit', async () => {
      const address = '0x' + 'a'.repeat(40);

      await expect(service.getAddressTransactions(address, 200)).rejects.toThrow(
        'Limit cannot exceed 100'
      );
    });
  });
});

