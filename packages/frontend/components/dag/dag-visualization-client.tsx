'use client';

import { useEffect, useRef, useState } from 'react';
import { DAGInfo } from '@/lib/hooks/use-dag';
import { formatHash, formatNumber } from '@/lib/utils/format';

interface DAGVisualizationProps {
  dagInfo: DAGInfo;
  onNodeClick?: (blockHash: string) => void;
}

export function DAGVisualizationClient({ dagInfo, onNodeClick }: DAGVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    
    setIsLoading(true);
    
    // Dynamically import vis-network (client-side only)
    Promise.all([
      import('vis-network'),
      import('vis-data'),
    ]).then(([visNetwork, visData]) => {
      const { Network: VisNetwork } = visNetwork;
      const { DataSet: VisDataSet } = visData;

      // Cleanup previous network
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }

      // Create nodes
      const nodes = new VisDataSet([
        {
          id: dagInfo.block.hash,
          label: `Block ${formatNumber(dagInfo.block.number)}`,
          title: `Hash: ${dagInfo.block.hash}\nBlue Score: ${formatNumber(dagInfo.block.blueScore)}`,
          color: dagInfo.block.isSelectedParent 
            ? { background: '#3b82f6', border: '#1e40af' }
            : { background: '#10b981', border: '#059669' },
          shape: 'box',
          font: { size: 14, color: '#ffffff' },
        },
        ...dagInfo.parents.map((parent) => ({
          id: parent.hash,
          label: `Block ${formatNumber(parent.number)}`,
          title: `Hash: ${parent.hash}\nBlue Score: ${formatNumber(parent.blueScore)}`,
          color: parent.isSelectedParent
            ? { background: '#3b82f6', border: '#1e40af' }
            : { background: '#6b7280', border: '#4b5563' },
          shape: 'box',
          font: { size: 12, color: '#ffffff' },
        })),
        ...dagInfo.children.map((child) => ({
          id: child.hash,
          label: `Block ${formatNumber(child.number)}`,
          title: `Hash: ${child.hash}\nBlue Score: ${formatNumber(child.blueScore)}`,
          color: { background: '#f59e0b', border: '#d97706' },
          shape: 'box',
          font: { size: 12, color: '#ffffff' },
        })),
      ]);

      // Create edges
      const edges = new VisDataSet(
        dagInfo.relationships.map((rel) => ({
          id: `${rel.parent}-${rel.child}`,
          from: rel.parent,
          to: rel.child,
          arrows: 'to',
          color: rel.isSelectedParent 
            ? { color: '#3b82f6', highlight: '#1e40af' }
            : { color: '#9ca3af', highlight: '#6b7280' },
          width: rel.isSelectedParent ? 3 : 1,
        }))
      );

      // Network options
      const options = {
        nodes: {
          borderWidth: 2,
          shadow: true,
        },
        edges: {
          smooth: {
            type: 'continuous',
            roundness: 0.5,
          },
          shadow: true,
        },
        physics: {
          enabled: true,
          stabilization: {
            enabled: true,
            iterations: 100,
          },
          barnesHut: {
            gravitationalConstant: -2000,
            centralGravity: 0.3,
            springLength: 200,
            springConstant: 0.04,
            damping: 0.09,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 100,
          zoomView: true,
          dragView: true,
        },
      };

      // Create network
      const container = containerRef.current;
      if (!container) return;
      const network = new VisNetwork(container as HTMLElement, { nodes, edges }, options as any);

      // Event handlers
      network.on('click', (params: any) => {
        if (params.nodes.length > 0) {
          const nodeId = params.nodes[0] as string;
          setSelectedNode(nodeId);
          if (onNodeClick) {
            onNodeClick(nodeId);
          }
        } else {
          setSelectedNode(null);
        }
      });

      networkRef.current = network;
      setIsLoading(false);
    }).catch((error) => {
      console.error('Failed to load DAG visualization:', error);
      setIsLoading(false);
    });

    // Cleanup function
    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [dagInfo, onNodeClick]);

  return (
    <div className="w-full h-full min-h-[600px] border rounded-lg bg-white relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <p className="text-gray-500">Loading DAG visualization...</p>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white p-2 rounded text-sm z-10">
          Selected: {formatHash(selectedNode)}
        </div>
      )}
    </div>
  );
}

