import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { Node, Edge, OnNodesChange, OnEdgesChange, Connection } from '@xyflow/react';

const initialNodes: Node[] = [
  { id: 'source-1', type: 'customService', position: { x: 250, y: 50 }, data: { label: 'RabbitMQ Source', status: 'offline', metric: 'Connecting...' } },
  { id: 'processor-1', type: 'customService', position: { x: 250, y: 220 }, data: { label: 'Worker Processor', status: 'offline', metric: 'Connecting...' } },
  { id: 'db-1', type: 'customService', position: { x: 250, y: 390 }, data: { label: 'PostgreSQL Analytics', status: 'offline', metric: 'Connecting...' } },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'source-1', target: 'processor-1', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e2-3', source: 'processor-1', target: 'db-1', animated: true, style: { stroke: '#f59e0b', strokeWidth: 2 } },
];

interface PipelineState {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  startListening: () => void;
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  
  onNodesChange: (changes) => set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) => set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) => set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  
  startListening: () => {
    setInterval(async () => {
      try {
        const res = await fetch('/api/metrics');
        if (!res.ok) throw new Error('Network error');
        const data = await res.json();
        
        set((state) => ({
          nodes: state.nodes.map(node => {
            if (node.id === 'source-1') return { ...node, data: { ...node.data, status: data.rabbitStatus, metric: data.rabbitMetric } };
            if (node.id === 'processor-1') return { ...node, data: { ...node.data, status: data.workerStatus, metric: data.workerMetric } };
            if (node.id === 'db-1') return { ...node, data: { ...node.data, status: data.dbStatus, metric: data.dbMetric } };
            return node;
          })
        }));
      } catch (error) {
        // צביעת כל הצמתים באדום במקרה של קריסת שרת
        set((state) => ({
          nodes: state.nodes.map(node => ({ ...node, data: { ...node.data, status: 'offline', metric: 'Server Disconnected' } }))
        }));
      }
    }, 1500);
  }
}));