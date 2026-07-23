import { usePipelineStore } from '../pipelineStore';
import { useEffect, useState } from 'react';

export default function SidePanel() {
  const { selectedNode, setSelectedNode } = usePipelineStore();
  const [logs, setLogs] = useState<string[]>([]);

  // מייצר "לוגים" חיים שרצים כל פעם שהפאנל פתוח
  useEffect(() => {
    if (!selectedNode) return;
    
    setLogs([`[System] Initializing connection to ${selectedNode.data.label}...`, `[Status] Connected successfully.`]);
    
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLogs = [...prev, `[Live] Heartbeat OK. Current metric: ${selectedNode.data.metric}`];
        return newLogs.slice(-6); // שומר רק את 6 השורות האחרונות
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [selectedNode]);

  if (!selectedNode) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: '380px', height: '100vh',
      backgroundColor: '#161b22', borderLeft: '1px solid #30363d',
      color: '#c9d1d9', padding: '24px', zIndex: 10,
      boxShadow: '-5px 0 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#58a6ff' }}>{selectedNode.data.label as string}</h2>
        <button 
          onClick={() => setSelectedNode(null)} 
          style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: '24px', cursor: 'pointer' }}
        >×</button>
      </div>

      {/* Status Cards */}
      <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>Status:</strong> 
          <span style={{ color: selectedNode.data.status === 'online' ? '#3fb950' : '#d29922', marginLeft: '8px', fontWeight: 'bold' }}>
            {(selectedNode.data.status as string).toUpperCase()}
          </span>
        </p>
        <p style={{ margin: 0 }}><strong>Metric:</strong> <span style={{ color: '#fff' }}>{selectedNode.data.metric as string}</span></p>
      </div>

      {/* Live Logs Terminal */}
      <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#8b949e', marginBottom: '12px' }}>Live Terminal</h3>
      <div style={{ 
        backgroundColor: '#010409', padding: '16px', borderRadius: '8px', 
        border: '1px solid #30363d', fontFamily: 'monospace', fontSize: '13px', 
        flexGrow: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' 
      }}>
        {logs.map((log, index) => (
          <div key={index} style={{ color: log.includes('Heartbeat') ? '#3fb950' : '#8b949e' }}>
            <span style={{ color: '#79c0ff' }}>{new Date().toLocaleTimeString()}</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
}