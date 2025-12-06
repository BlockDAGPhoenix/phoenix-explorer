import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { Block, ApiResponse } from '@/types/api';

export function useLatestBlocks(limit: number = 10) {
  return useQuery({
    queryKey: ['blocks', 'latest', limit],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ blocks: Block[] }>>(
        `/blocks/latest?limit=${limit}`
      );
      return response.data.data.blocks;
    },
    refetchInterval: 5000, // Refetch every 5 seconds
  });
}

export function useBlockByNumber(blockNumber: string | bigint) {
  return useQuery({
    queryKey: ['blocks', 'number', blockNumber],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Block>>(
        `/blocks/${blockNumber}`
      );
      return response.data.data;
    },
    enabled: !!blockNumber,
  });
}

export function useBlockByHash(hash: string) {
  return useQuery({
    queryKey: ['blocks', 'hash', hash],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Block>>(
        `/blocks/hash/${hash}`
      );
      return response.data.data;
    },
    enabled: !!hash && hash.startsWith('0x'),
  });
}

