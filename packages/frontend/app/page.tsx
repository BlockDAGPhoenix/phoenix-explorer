'use client';

import Link from 'next/link';
import { useLatestBlocks } from '@/lib/hooks/use-blocks';
import { useLatestTransactions } from '@/lib/hooks/use-transactions';
import { BlockCard } from '@/components/blocks/block-card';
import { TransactionCard } from '@/components/transactions/transaction-card';

export default function Home() {
  const { data: blocks, isLoading: blocksLoading } = useLatestBlocks(10);
  const { data: transactions, isLoading: transactionsLoading } = useLatestTransactions(10);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Phoenix Explorer</h1>
        <p className="text-lg text-muted-foreground">
          Explore the Phoenix Network BlockDAG
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Blocks */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Latest Blocks</h2>
            <Link 
              href="/blocks"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          {blocksLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : blocks && blocks.length > 0 ? (
            <div className="space-y-4">
              {blocks.map((block) => (
                <BlockCard key={block.hash} block={block} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No blocks found
            </div>
          )}
        </section>

        {/* Latest Transactions */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Latest Transactions</h2>
            <Link 
              href="/transactions"
              className="text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All →
            </Link>
          </div>
          
          {transactionsLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
              ))}
            </div>
          ) : transactions && transactions.length > 0 ? (
            <div className="space-y-4">
              {transactions.map((tx) => (
                <TransactionCard key={tx.hash} transaction={tx} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No transactions found
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
