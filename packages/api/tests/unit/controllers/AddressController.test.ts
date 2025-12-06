import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Request, Response } from 'express';
import { AddressController } from '@/controllers/AddressController';
import { IAddressService } from '@/interfaces/services/IAddressService';
import { Address, Transaction } from '@/domain';

describe('AddressController', () => {
  let controller: AddressController;
  let mockService: IAddressService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockService = {
      getAddress: vi.fn(),
      getAddressBalance: vi.fn(),
      getAddressTransactions: vi.fn(),
    };

    controller = new AddressController(mockService);

    mockRequest = {
      params: {},
      query: {},
    };

    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
  });

  describe('getAddress', () => {
    it('should return address successfully', async () => {
      const expectedAddress: Address = {
        address: '0x' + 'a'.repeat(40),
        balance: 1000000000000000000n,
        nonce: 5n,
        isContract: false,
        transactionCount: 10n,
      };

      mockRequest.params = { address: expectedAddress.address };
      vi.mocked(mockService.getAddress).mockResolvedValue(expectedAddress);

      await controller.getAddress(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getAddress).toHaveBeenCalledWith(expectedAddress.address);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: expectedAddress,
      });
    });

    it('should return 404 when address not found', async () => {
      const address = '0x' + '0'.repeat(40);
      mockRequest.params = { address };
      vi.mocked(mockService.getAddress).mockResolvedValue(null);

      await controller.getAddress(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should handle invalid address format', async () => {
      mockRequest.params = { address: 'invalid-address' };

      await controller.getAddress(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('getAddressBalance', () => {
    it('should return balance successfully', async () => {
      const address = '0x' + 'a'.repeat(40);
      const balance = 1000000000000000000n;

      mockRequest.params = { address };
      vi.mocked(mockService.getAddressBalance).mockResolvedValue(balance);

      await controller.getAddressBalance(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: { balance: balance.toString() },
      });
    });
  });

  describe('getAddressTransactions', () => {
    it('should return transactions successfully', async () => {
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

      mockRequest.params = { address };
      mockRequest.query = { limit: '10', type: 'sent' };
      vi.mocked(mockService.getAddressTransactions).mockResolvedValue(expectedTxs);

      await controller.getAddressTransactions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getAddressTransactions).toHaveBeenCalledWith(address, 10, 'sent');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });

    it('should use default limit and type when not provided', async () => {
      const address = '0x' + 'a'.repeat(40);
      mockRequest.params = { address };
      mockRequest.query = {};
      vi.mocked(mockService.getAddressTransactions).mockResolvedValue([]);

      await controller.getAddressTransactions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getAddressTransactions).toHaveBeenCalledWith(address, 20, 'all');
    });
  });
});

