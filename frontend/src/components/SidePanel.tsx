import { usePipelineStore } from '../pipelineStore';
import { useEffect, useState, useRef } from 'react';

export default function SidePanel() {
  const { selectedNode, setSelectedNode } = usePipelineStore();
  const [logs, setLogs] = useState<string[]>([]);
  const currentIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!selectedNode) return;
    if (currentIdRef.current !== selectedNode.id) {
      currentIdRef.current = selectedNode.id;
      setLogs([`[System] Initializing connection to ${selectedNode.data.label}...`, `[Status] Connected successfully.`]);
    }
  }, [selectedNode]);

  const handleAction = async (action: 'fire' | 'clear') => {
    console.log(`[DEBUG] Button physically clicked: ${action}`);
    
    setLogs(prev => [...prev, `[ACTION] Executing ${action}...`].slice(-6));
    try {
      // ניתוב הבקשה לנתיב המדויק שמוגדר בשרת ה-Backend
      const endpoint = action === 'fire' ? '/api/trigger' : '/api/clear';
      
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(prev => [...prev, `[SUCCESS] ${data.message}`].slice(-6));
    } catch (error) {
      setLogs(prev => [...prev, `[ERROR] Action failed. Check backend connection.`].slice(-6));
    }
  };

  if (!selectedNode) return null;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: '380px', height: '100vh',
      backgroundColor: '#161b22', borderLeft: '1px solid #30363d',
      color: '#c9d1d9', padding: '24px', 
      zIndex: 9999,
      boxShadow: '-5px 0 15px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column',
      pointerEvents: 'auto'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', color: '#58a6ff' }}>{selectedNode.data.label as string}</h2>
        <button onClick={() => setSelectedNode(null)} style={{ background: 'transparent', border: 'none', color: '#8b949e', fontSize: '24px', cursor: 'pointer' }}>×</button>
      </div>

      <div style={{ backgroundColor: '#0d1117', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', marginBottom: '24px' }}>
        <p style={{ margin: '0 0 12px 0' }}>
          <strong>Status:</strong> 
          <span style={{ color: selectedNode.data.status === 'online' ? '#3fb950' : '#d29922', marginLeft: '8px', fontWeight: 'bold' }}>
            {(selectedNode.data.status as string).toUpperCase()}
          </span>
        </p>
        <p style={{ margin: 0 }}><strong>Metric:</strong> <span style={{ color: '#fff' }}>{selectedNode.data.metric as string}</span></p>
      </div>

      {(selectedNode.id === 'source-1' || selectedNode.id === 'db-1') && (
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#8b949e', marginBottom: '12px' }}>Actions</h3>
          {selectedNode.id === 'source-1' && (
            <button onClick={() => handleAction('fire')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#da3633', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', position: 'relative', zIndex: 10000 }}>
              🔥 Fire 50 Messages
            </button>
          )}
          {selectedNode.id === 'db-1' && (
            <button onClick={() => handleAction('clear')}
              style={{ width: '100%', padding: '12px', backgroundColor: '#8957e5', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', position: 'relative', zIndex: 10000 }}>
              🗑️ Clear Database
            </button>
          )}
        </div>
      )}

      <h3 style={{ fontSize: '14px', textTransform: 'uppercase', color: '#8b949e', marginBottom: '12px' }}>Live Terminal</h3>
      <div style={{ backgroundColor: '#010409', padding: '16px', borderRadius: '8px', border: '1px solid #30363d', fontFamily: 'monospace', fontSize: '13px', flexGrow: 1, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {logs.map((log, index) => (
          <div key={index} style={{ color: log.includes('SUCCESS') ? '#3fb950' : log.includes('ERROR') ? '#f85149' : log.includes('ACTION') ? '#e3b341' : '#8b949e' }}>
            <span style={{ color: '#79c0ff' }}>{new Date().toLocaleTimeString()}</span> {log}
          </div>
        ))}
      </div>
    </div>
  );
}