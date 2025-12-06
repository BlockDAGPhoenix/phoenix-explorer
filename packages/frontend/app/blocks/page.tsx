'use client';

import Link from 'next/link';
import { useLatestBlocks } from '@/lib/hooks/use-blocks';
import { BlockCard } from '@/components/blocks/block-card';

export default function BlocksPage() {
  const { data: blocks, isLoading } = useLatestBlocks(50);

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Blocks</h1>
        <p className="text-lg text-muted-foreground">
          Browse all blocks in the Phoenix Network BlockDAG
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(10)].map((_, i) => (
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
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-xl mb-2">No blocks found</p>
          <p>Blocks will appear here once the indexer starts processing.</p>
        </div>
      )}
    </main>
  );
}

