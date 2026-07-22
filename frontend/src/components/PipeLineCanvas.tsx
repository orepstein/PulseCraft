import { useEffect } from 'react';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { usePipelineStore } from '../pipelineStore';
import ServiceNode from './ServiceNode';

const nodeTypes = {
  customService: ServiceNode,
};

export default function PipeLineCanvas() {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, startListening } = usePipelineStore();

  useEffect(() => {
    startListening();
  }, [startListening]);

  return (
    <div style={{ width: '100vw', height: '100vh', backgroundColor: '#0f0f0f' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background color="#222" gap={20} />
        <Controls style={{ backgroundColor: '#fff', color: '#000' }} />
        <MiniMap nodeColor="#444" maskColor="rgba(0,0,0,0.8)" style={{ backgroundColor: '#1e1e1e' }} />
      </ReactFlow>
    </div>
  );
}