'use client';

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useBlockDAGInfo } from '@/lib/hooks/use-dag';
import { DAGVisualization } from '@/components/dag/dag-visualization';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatHash, formatNumber } from '@/lib/utils/format';
import { useState } from 'react';

export default function BlockDAGPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const blockNumber = params.blockNumber as string;
  const depth = parseInt(searchParams.get('depth') || '1', 10);
  
  const [selectedDepth, setSelectedDepth] = useState(depth);
  const { data: dagInfo, isLoading } = useBlockDAGInfo(blockNumber, selectedDepth);

  const handleNodeClick = (blockHash: string) => {
    // Extract block number from hash or navigate to hash
    window.location.href = `/blocks/hash/${blockHash}`;
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="h-96 bg-gray-200 animate-pulse rounded-lg" />
      </main>
    );
  }

  if (!dagInfo) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-16">
          <h1 className="text-2xl font-bold mb-2">DAG Information Not Found</h1>
          <p className="text-muted-foreground mb-4">
            DAG information for Block #{blockNumber} is not available
          </p>
          <Link href={`/blocks/${blockNumber}`} className="text-blue-600 hover:text-blue-700">
            ← Back to Block
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link 
          href={`/blocks/${blockNumber}`} 
          className="text-blue-600 hover:text-blue-700 mb-4 inline-block"
        >
          ← Back to Block #{formatNumber(blockNumber)}
        </Link>
        <h1 className="text-4xl font-bold mb-2">DAG Visualization</h1>
        <p className="text-muted-foreground">
          Block #{formatNumber(blockNumber)} - Blue Score: {formatNumber(dagInfo.block.blueScore)}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* DAG Visualization */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>DAG Graph</CardTitle>
                <div className="flex items-center gap-2">
                  <label className="text-sm">Depth:</label>
                  <select
                    value={selectedDepth}
                    onChange={(e) => setSelectedDepth(parseInt(e.target.value, 10))}
                    className="border rounded px-2 py-1 text-sm"
                  >
                    {[1, 2, 3, 4, 5].map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <DAGVisualization dagInfo={dagInfo} onNodeClick={handleNodeClick} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle>Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-600 rounded"></div>
                <span className="text-sm">Selected Parent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-600 rounded"></div>
                <span className="text-sm">Current Block</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gray-600 rounded"></div>
                <span className="text-sm">Parent Block</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-orange-500 rounded"></div>
                <span className="text-sm">Child Block</span>
              </div>
            </CardContent>
          </Card>

          {/* Block Info */}
          <Card>
            <CardHeader>
              <CardTitle>Block Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <span className="text-muted-foreground">Hash:</span>
                <p className="font-mono break-all">{formatHash(dagInfo.block.hash)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Blue Score:</span>
                <p>{formatNumber(dagInfo.block.blueScore)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Parents:</span>
                <p>{dagInfo.parents.length}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Children:</span>
                <p>{dagInfo.children.length}</p>
              </div>
            </CardContent>
          </Card>

          {/* GHOSTDAG Data */}
          {dagInfo.ghostdagData && (
            <Card>
              <CardHeader>
                <CardTitle>GHOSTDAG Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Blue Score:</span>
                  <p>{formatNumber(dagInfo.ghostdagData.blueScore)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Blue Work:</span>
                  <p>{formatNumber(dagInfo.ghostdagData.blueWork)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Merge Set Blues:</span>
                  <p>{dagInfo.ghostdagData.mergeSetBlues.length}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Merge Set Reds:</span>
                  <p>{dagInfo.ghostdagData.mergeSetReds.length}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}

