import { useState, useCallback } from 'react';
import ReactFlow, { 
  Background, 
  Controls, 
  applyNodeChanges, 
  applyEdgeChanges 
} from 'reactflow';
import type { Node, Edge, NodeChange, EdgeChange } from 'reactflow'; // <--- התיקון כאן: הוספנו 'type'
import 'reactflow/dist/style.css';

// הגדרת ה"קופסאות" - רכיבי המערכת שלנו
const initialNodes: Node[] = [
  { 
    id: '1', 
    position: { x: 50, y: 150 }, 
    data: { label: '🌐 API Endpoint' }, 
    style: { background: '#161b22', color: '#c9d1d9', border: '1px solid #30363d', borderRadius: '8px', padding: '10px', width: '150px', textAlign: 'center' } 
  },
  { 
    id: '2', 
    position: { x: 300, y: 150 }, 
    data: { label: '🐰 RabbitMQ' }, 
    style: { background: '#161b22', color: '#c9d1d9', border: '1px solid #ff9900', borderRadius: '8px', padding: '10px', width: '150px', textAlign: 'center' } 
  },
  { 
    id: '3', 
    position: { x: 550, y: 150 }, 
    data: { label: '⚙️ DB Worker' }, 
    style: { background: '#161b22', color: '#c9d1d9', border: '1px solid #3fb950', borderRadius: '8px', padding: '10px', width: '150px', textAlign: 'center' } 
  },
  { 
    id: '4', 
    position: { x: 800, y: 150 }, 
    data: { label: '🗄️ PostgreSQL' }, 
    style: { background: '#161b22', color: '#c9d1d9', border: '1px solid #58a6ff', borderRadius: '8px', padding: '10px', width: '150px', textAlign: 'center' } 
  },
];

// הגדרת ה"כבלים" - הניתוב והזרימה
const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#8b949e', strokeWidth: 2 } },
  { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#ff9900', strokeWidth: 2 } },
  { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#3fb950', strokeWidth: 2 } },
];

export function SignalFlowCanvas() {
  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  );
  
  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  );

  return (
    <div style={{ height: '300px', width: '100%', backgroundColor: '#0d1117', borderRadius: '12px', border: '1px solid #30363d', marginBottom: '24px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        fitView
      >
        <Background color="#30363d" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
}