'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useTransactionByHash } from '@/lib/hooks/use-transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHash, formatAddress, formatWeiToEther, formatTimestamp, formatGasPrice, formatGasUsed, formatNumber } from '@/lib/utils/format';

export default function TransactionDetailPage() {
  const params = useParams();
  const hash = params.hash as string;
  
  const { data: transaction, isLoading } = useTransactionByHash(hash);

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </main>
    );
  }

  if (!transaction) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Transaction Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Transaction {formatHash(hash)} does not exist
          </p>
          <Link href="/transactions" className="text-blue-600 hover:text-blue-700">
            ← Back to Transactions
          </Link>
        </div>
      </main>
    );
  }

  const timestamp = transaction.timestamp 
    ? (typeof transaction.timestamp === 'bigint' 
        ? Number(transaction.timestamp) 
        : Number(transaction.timestamp))
    : Date.now();

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link href="/transactions" className="text-blue-600 hover:text-blue-700 mb-4 inline-block">
          ← Back to Transactions
        </Link>
        <h1 className="text-4xl font-bold mb-2">Transaction</h1>
        <p className="font-mono text-sm text-muted-foreground break-all">{transaction.hash}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Hash</p>
                    <p className="font-mono break-all">{transaction.hash}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className={transaction.status === 1 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {transaction.status === 1 ? 'Success' : 'Failed'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Block Number</p>
                    <Link 
                      href={`/blocks/${transaction.blockNumber}`}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      {formatNumber(transaction.blockNumber)}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Block Hash</p>
                    <Link 
                      href={`/blocks/hash/${transaction.blockHash}`}
                      className="font-mono text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {formatHash(transaction.blockHash)}
                    </Link>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <Link 
                      href={`/addresses/${transaction.from}`}
                      className="font-mono text-sm text-blue-600 hover:text-blue-700 break-all"
                    >
                      {transaction.from}
                    </Link>
                  </div>
                  {transaction.to ? (
                    <div>
                      <p className="text-sm text-muted-foreground">To</p>
                      <Link 
                        href={`/addresses/${transaction.to}`}
                        className="font-mono text-sm text-blue-600 hover:text-blue-700 break-all"
                      >
                        {transaction.to}
                      </Link>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground">Contract Creation</p>
                      <p className="text-sm">Yes</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground">Value</p>
                    <p className="font-semibold">{formatWeiToEther(transaction.value)} PHX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Price</p>
                    <p>{formatGasPrice(transaction.gasPrice)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Used</p>
                    <p>{formatGasUsed(transaction.gasUsed, transaction.gasLimit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gas Limit</p>
                    <p>{formatNumber(transaction.gasLimit)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nonce</p>
                    <p>{formatNumber(transaction.nonce)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Timestamp</p>
                    <p>{formatTimestamp(timestamp)}</p>
                  </div>
                </div>
                
                {transaction.input && transaction.input !== '0x' && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">Input Data</p>
                    <p className="font-mono text-xs break-all bg-gray-100 p-2 rounded">
                      {transaction.input}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/blocks/${transaction.blockNumber}`}
                className="block text-blue-600 hover:text-blue-700"
              >
                View Block →
              </Link>
              <Link
                href={`/addresses/${transaction.from}`}
                className="block text-blue-600 hover:text-blue-700"
              >
                View From Address →
              </Link>
              {transaction.to && (
                <Link
                  href={`/addresses/${transaction.to}`}
                  className="block text-blue-600 hover:text-blue-700"
                >
                  View To Address →
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

