import Link from 'next/link';
import { SearchBar } from '@/components/search/search-bar';
import { ThemeToggle } from './theme-toggle';

export function Navigation() {
  return (
    <nav className="border-b bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="text-xl font-bold whitespace-nowrap text-gray-900 dark:text-white">
            Phoenix Explorer
          </Link>
          <div className="flex-1 max-w-md">
            <SearchBar />
          </div>
          <div className="flex items-center space-x-4 whitespace-nowrap">
            <Link 
              href="/blocks" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Blocks
            </Link>
            <Link 
              href="/transactions" 
              className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Transactions
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

