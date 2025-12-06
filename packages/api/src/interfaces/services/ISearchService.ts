import { SearchResult } from '../../domain/Search';

/**
 * Search Service Interface (ISP: Single responsibility)
 * Handles search operations
 */
export interface ISearchService {
  search(query: string): Promise<SearchResult[]>;
}

