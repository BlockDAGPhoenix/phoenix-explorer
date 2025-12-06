import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHash, formatAddress, formatWeiToEther, formatRelativeTime } from '@/lib/utils/format';
import { Transaction } from '@/types/api';

interface TransactionCardProps {
  transaction: Transaction;
}

export function TransactionCard({ transaction }: TransactionCardProps) {
  const timestamp = transaction.timestamp 
    ? (typeof transaction.timestamp === 'bigint' 
        ? Number(transaction.timestamp) 
        : Number(transaction.timestamp))
    : Date.now();

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          <Link 
            href={`/transactions/${transaction.hash}`}
            className="hover:text-blue-600 transition-colors font-mono text-sm"
          >
            {formatHash(transaction.hash)}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">From:</span>
            <Link 
              href={`/addresses/${transaction.from}`}
              className="font-mono hover:text-blue-600 transition-colors"
            >
              {formatAddress(transaction.from)}
            </Link>
          </div>
          {transaction.to && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">To:</span>
              <Link 
                href={`/addresses/${transaction.to}`}
                className="font-mono hover:text-blue-600 transition-colors"
              >
                {formatAddress(transaction.to)}
              </Link>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Value:</span>
            <span className="font-semibold">{formatWeiToEther(transaction.value)} PHX</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status:</span>
            <span className={transaction.status === 1 ? 'text-green-600' : 'text-red-600'}>
              {transaction.status === 1 ? 'Success' : 'Failed'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Time:</span>
            <span>{formatRelativeTime(timestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

