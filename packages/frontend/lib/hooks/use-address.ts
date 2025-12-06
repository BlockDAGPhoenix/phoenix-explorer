import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { Address, Transaction, ApiResponse } from '@/types/api';

export function useAddress(address: string) {
  return useQuery({
    queryKey: ['addresses', address],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Address>>(
        `/addresses/${address}`
      );
      return response.data.data;
    },
    enabled: !!address && address.startsWith('0x'),
  });
}

export function useAddressTransactions(
  address: string,
  limit: number = 20,
  type: 'sent' | 'received' | 'all' = 'all'
) {
  return useQuery({
    queryKey: ['addresses', address, 'transactions', limit, type],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ transactions: Transaction[] }>>(
        `/addresses/${address}/transactions?limit=${limit}&type=${type}`
      );
      return response.data.data.transactions;
    },
    enabled: !!address && address.startsWith('0x'),
  });
}

export function useAddressBalance(address: string) {
  return useQuery({
    queryKey: ['addresses', address, 'balance'],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ balance: string }>>(
        `/addresses/${address}/balance`
      );
      return BigInt(response.data.data.balance);
    },
    enabled: !!address && address.startsWith('0x'),
    refetchInterval: 10000, // Refetch every 10 seconds
  });
}

