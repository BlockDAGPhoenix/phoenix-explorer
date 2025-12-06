'use client';

import Link from 'next/link';
import { useLatestTransactions } from '@/lib/hooks/use-transactions';
import { TransactionCard } from '@/components/transactions/transaction-card';

export default function TransactionsPage() {
  const { data: transactions, isLoading } = useLatestTransactions(50);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Transactions</h1>
        <p className="text-lg text-muted-foreground">
          Browse all transactions in the Phoenix Network
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
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
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-xl mb-2">No transactions found</p>
          <p>Transactions will appear here once the indexer starts processing.</p>
        </div>
      )}
    </main>
  );
}

