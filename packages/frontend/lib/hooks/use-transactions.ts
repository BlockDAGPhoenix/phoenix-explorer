import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { Transaction, ApiResponse } from '@/types/api';

export function useLatestTransactions(limit: number = 10) {
  return useQuery({
    queryKey: ['transactions', 'latest', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ transactions: Transaction[] }>>(
        `/transactions/latest?limit=${limit}`
      );
      return response.data.data.transactions;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useTransactionByHash(hash: string) {
  return useQuery({
    queryKey: ['transactions', 'hash', hash],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Transaction>>(
        `/transactions/${hash}`
      );
      return response.data.data;
    },
    enabled: !!hash && hash.startsWith('0x'),
  });
}

export function useTransactionsByBlockHash(blockHash: string) {
  return useQuery({
    queryKey: ['transactions', 'block', blockHash],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ transactions: Transaction[] }>>(
        `/transactions/by-block/${blockHash}`
      );
      return response.data.data.transactions;
    },
    enabled: !!blockHash && blockHash.startsWith('0x'),
  });
}

