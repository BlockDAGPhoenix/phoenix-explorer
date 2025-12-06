'use client';

import dynamic from 'next/dynamic';
import { DAGInfo } from '@/lib/hooks/use-dag';

interface DAGVisualizationProps {
  dagInfo: DAGInfo;
  onNodeClick?: (blockHash: string) => void;
}

// Dynamic import with SSR disabled
const DAGVisualizationClient = dynamic(
  () => import('./dag-visualization-client').then((mod) => ({ default: mod.DAGVisualizationClient })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full min-h-[600px] border rounded-lg bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading DAG visualization...</p>
      </div>
    ),
  }
);

export function DAGVisualization(props: DAGVisualizationProps) {
  return <DAGVisualizationClient {...props} />;
}
