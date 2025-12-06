import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api-client';
import { ApiResponse } from '@/types/api';

export interface DAGBlock {
  hash: string;
  number: string;
  blueScore: string;
  isSelectedParent?: boolean;
}

export interface DAGRelationship {
  parent: string;
  child: string;
  isSelectedParent: boolean;
}

export interface GHOSTDAGData {
  blueScore: string;
  blueWork: string;
  mergeSetBlues: string[];
  mergeSetReds: string[];
}

export interface DAGInfo {
  block: DAGBlock;
  parents: DAGBlock[];
  children: DAGBlock[];
  ghostdagData?: GHOSTDAGData;
  relationships: DAGRelationship[];
}

export function useBlockDAGInfo(blockNumber: string | bigint, depth: number = 1) {
  return useQuery({
    queryKey: ['dag', 'block', blockNumber, depth],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<DAGInfo>>(
        `/dag/blocks/${blockNumber}/dag?depth=${depth}`
      );
      return response.data.data;
    },
    enabled: !!blockNumber,
  });
}

export function useBlockParents(blockHash: string) {
  return useQuery({
    queryKey: ['dag', 'parents', blockHash],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ parents: string[] }>>(
        `/dag/blocks/${blockHash}/parents`
      );
      return response.data.data.parents;
    },
    enabled: !!blockHash && blockHash.startsWith('0x'),
  });
}

export function useBlockChildren(blockHash: string) {
  return useQuery({
    queryKey: ['dag', 'children', blockHash],
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<{ children: string[] }>>(
        `/dag/blocks/${blockHash}/children`
      );
      return response.data.data.children;
    },
    enabled: !!blockHash && blockHash.startsWith('0x'),
  });
}

