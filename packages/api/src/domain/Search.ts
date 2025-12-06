/**
 * Search Domain Models
 */
export type SearchResultType = 'address' | 'transaction' | 'block';

export interface SearchResult {
  type: SearchResultType;
  address?: string;
  hash?: string;
  blockNumber?: bigint;
  isContract?: boolean;
  label?: string;
}

