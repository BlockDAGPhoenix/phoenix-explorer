'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBlockByNumber } from '@/lib/hooks/use-blocks';
import { useTransactionsByBlockHash } from '@/lib/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { formatHash, formatNumber, formatTimestamp, formatGasUsed } from '@/lib/utils/format';

export default function BlockDetailPage() {
  const params = useParams();
  const blockNumber = params.blockNumber as string;
  
  const { data: block, isLoading: blockLoading } = useBlockByNumber(blockNumber);
  const { data: transactions, isLoading: transactionsLoading } = useTransactionsByBlockHash(
    block?.hash || ''
  );

  if (blockLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </main>
    );
  }

  if (!block) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Block Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Block #{blockNumber} does not exist
          </p>
          <Link href="/blocks" className="text-blue-600 hover:text-blue-700">
            ← Back to Blocks
          </Link>
        </div>
      </main>
    );
  }

  const timestamp = typeof block.timestamp === 'bigint' 
    ? Number(block.timestamp) 
    : Number(block.timestamp);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/blocks" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Blocks
        </Link>
        <h1 className="text-4xl font-bold mb-2">Block #{formatNumber(block.number)}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Block Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Block Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hash</p>
                    <p className="font-mono break-all">{block.hash}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blue Score</p>
                    <p>{formatNumber(block.blueScore)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p>{formatTimestamp(timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p>{block.transactionCount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Used</p>
                    <p>{formatGasUsed(block.gasUsed, block.gasLimit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Limit</p>
                    <p>{formatNumber(block.gasLimit)}</p>
                  </div>
                </div>
                
                {block.parentHashes && block.parentHashes.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Parent Blocks</p>
                    <div className="space-y-1">
                      {block.parentHashes.map((parentHash, index) => (
                        <Link
                          key={index}
                          href={`/blocks/hash/${parentHash}`}
                          className="block font-mono text-sm hover:text-blue-600 transition-colors"
                        >
                          {formatHash(parentHash)}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transactions */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions ({transactions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-gray-200 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <div className="space-y-4">
                  {transactions.map((tx) => (
                    <TransactionCard key={tx.hash} transaction={tx} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  No transactions in this block
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                  <Link
                    href={`/blocks/${Number(block.number) + 1}`}
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    Next Block →
                  </Link>
                  <Link
                    href={`/blocks/${block.number}/dag`}
                    className="block text-blue-600 hover:text-blue-700"
                  >
                    View DAG →
                  </Link>
              {Number(block.number) > 0 && (
                <Link
                  href={`/blocks/${Number(block.number) - 1}`}
                  className="block text-blue-600 hover:text-blue-700"
                >
                  ← Previous Block
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

