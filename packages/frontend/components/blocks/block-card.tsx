import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHash, formatNumber, formatRelativeTime } from '@/lib/utils/format';
import { Block } from '@/types/api';

interface BlockCardProps {
  block: Block;
}

export function BlockCard({ block }: BlockCardProps) {
  const timestamp = typeof block.timestamp === 'bigint' 
    ? Number(block.timestamp) 
    : Number(block.timestamp);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="text-lg">
          <Link 
            href={`/blocks/${block.number}`}
            className="hover:text-blue-600 transition-colors"
          >
            Block #{formatNumber(block.number)}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hash:</span>
            <span className="font-mono">{formatHash(block.hash)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Blue Score:</span>
            <span>{formatNumber(block.blueScore)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Transactions:</span>
            <span>{block.transactionCount}</span>
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

