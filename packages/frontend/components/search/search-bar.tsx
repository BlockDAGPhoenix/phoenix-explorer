'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearch } from '@/lib/hooks/use-search';
import { SearchResult } from '@/lib/hooks/use-search';
import { formatHash, formatAddress } from '@/lib/utils/format';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchRef = useRef<HTMLDivElement>(null);

  const { data: results, isLoading } = useSearch(debouncedQuery);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setQuery('');
  };

  const getResultUrl = (result: SearchResult): string => {
    switch (result.type) {
      case 'address':
        return `/addresses/${result.address}`;
      case 'transaction':
        return `/transactions/${result.hash}`;
      case 'block':
        return result.blockNumber 
          ? `/blocks/${result.blockNumber}`
          : `/blocks/hash/${result.hash}`;
      default:
        return '#';
    }
  };

  const getResultLabel = (result: SearchResult): string => {
    switch (result.type) {
      case 'address':
        return `Address: ${formatAddress(result.address || '')}`;
      case 'transaction':
        return `Transaction: ${formatHash(result.hash || '')}`;
      case 'block':
        return result.blockNumber 
          ? `Block #${result.blockNumber}`
          : `Block: ${formatHash(result.hash || '')}`;
      default:
        return '';
    }
  };

  return (
    <div ref={searchRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search by address, transaction hash, or block number..."
          className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && query && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-gray-500">Searching...</div>
          ) : results && results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <Link
                  key={index}
                  href={getResultUrl(result)}
                  onClick={() => handleResultClick(result)}
                  className="block px-4 py-3 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{getResultLabel(result)}</p>
                      {result.isContract !== undefined && (
                        <p className="text-sm text-gray-500">
                          {result.isContract ? 'Contract' : 'Account'}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 capitalize">{result.type}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}
    </div>
  );
}

