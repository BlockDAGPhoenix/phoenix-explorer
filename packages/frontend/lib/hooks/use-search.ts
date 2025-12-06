import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { ApiResponse } from '@/types/api';

export type SearchResultType = 'address' | 'transaction' | 'block';

export interface SearchResult {
  type: SearchResultType;
  address?: string;
  hash?: string;
  blockNumber?: string;
  isContract?: boolean;
  label?: string;
}

export function useSearch(query: string) {
  return useQuery({
    queryKey: ['search', query],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ results: SearchResult[] }>>(
        `/search?q=${encodeURIComponent(query)}`
      );
      return response.data.data.results;
    },
    enabled: !!query && query.trim().length > 0,
    staleTime: 60000, // Cache for 1 minute
  });
}

