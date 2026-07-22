import { Handle, Position } from '@xyflow/react';

interface ServiceNodeProps {
  data: {
    label: string;
    status: 'online' | 'offline' | 'processing';
    metric?: string;
  };
}

export default function ServiceNode({ data }: ServiceNodeProps) {
  // קביעת צבע המסגרת ונורית החיווי לפי סטטוס הפעילות
  const statusColor = 
    data.status === 'online' ? '#10b981' : // ירוק
    data.status === 'processing' ? '#f59e0b' : // כתום
    '#ef4444'; // אדום

  return (
    <div style={{
      padding: '16px',
      borderRadius: '12px',
      backgroundColor: '#1e1e1e',
      border: `2px solid ${statusColor}`,
      color: '#ffffff',
      minWidth: '220px',
      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
      fontFamily: 'sans-serif'
    }}>
      {/* נקודת כניסה (יורנדר אוטומטית אם יש חיבור נכנס) */}
      <Handle type="target" position={Position.Top} style={{ background: '#777', width: '10px', height: '10px' }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{data.label}</span>
        {/* נורית סטטוס מהבהבת / קבועה */}
        <div style={{ 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: statusColor,
          boxShadow: `0 0 8px ${statusColor}`
        }}></div>
      </div>

      <div style={{ fontSize: '13px', color: '#a1a1aa', backgroundColor: '#2d2d2d', padding: '6px', borderRadius: '6px', textAlign: 'center' }}>
        {data.metric || 'No data'}
      </div>

      {/* נקודת יציאה (יורנדר אוטומטית אם יש חיבור יוצא) */}
      <Handle type="source" position={Position.Bottom} style={{ background: '#777', width: '10px', height: '10px' }} />
    </div>
  );
}