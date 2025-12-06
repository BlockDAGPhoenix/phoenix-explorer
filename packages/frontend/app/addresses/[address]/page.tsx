'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAddress, useAddressTransactions } from '@/lib/hooks/use-address';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionCard } from '@/components/transactions/transaction-card';
import { formatAddress, formatWeiToEther, formatNumber, formatTimestamp } from '@/lib/utils/format';

export default function AddressDetailPage() {
  const params = useParams();
  const address = params.address as string;
  
  const { data: addressData, isLoading: addressLoading } = useAddress(address);
  const { data: transactions, isLoading: transactionsLoading } = useAddressTransactions(address, 20);

  if (addressLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </main>
    );
  }

  if (!addressData) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">Address Not Found</h1>
          <p className="text-muted-foreground mb-4">
            Address {formatAddress(address)} does not exist
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-4xl font-bold mb-2">Address</h1>
        <p className="font-mono text-sm text-muted-foreground break-all">{addressData.address}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-mono break-all">{addressData.address}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <p>{addressData.isContract ? 'Contract' : 'Account'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Balance</p>
                    <p className="font-semibold text-lg">{formatWeiToEther(addressData.balance)} PHX</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nonce</p>
                    <p>{formatNumber(addressData.nonce)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Transactions</p>
                    <p>{formatNumber(addressData.transactionCount)}</p>
                  </div>
                  {addressData.firstSeenAt && (
                    <div>
                      <p className="text-sm text-muted-foreground">First Seen</p>
                      <p>{formatTimestamp(addressData.firstSeenAt)}</p>
                    </div>
                  )}
                </div>
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
                  No transactions found for this address
                </p>
              )}
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
                href={`/transactions?from=${address}`}
                className="block text-blue-600 hover:text-blue-700"
              >
                View Sent Transactions →
              </Link>
              <Link
                href={`/transactions?to=${address}`}
                className="block text-blue-600 hover:text-blue-700"
              >
                View Received Transactions →
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

