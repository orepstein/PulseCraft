import { useEffect, useState } from 'react';

// הגדרת המבנה של הרשומה לפי ה-Prisma Schema שלנו
interface EventData {
  id: number;
  userId: string;
  eventType: string;
  payload: any;
  createdAt: string;
}

export function DashboardStats() {
  const [stats, setStats] = useState<{ total: number; data: EventData[] }>({ total: 0, data: [] });

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        // ה-Proxy של Vite ינתב את הקריאה הזו ישירות לפורט 3000 של השרת שלך
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        const result = await res.json();
        
        if (result.success) {
          setStats({ total: result.total, data: result.data });
        }
      } catch (error) {
        console.error('[Dashboard] Error fetching events:', error);
      }
    };

    // שליפה ראשונית
    fetchEvents();
    
    // הפעלת דגימה (Polling) כל 3 שניות לעדכון חי של המספרים והטבלה
    const interval = setInterval(fetchEvents, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ padding: '24px', backgroundColor: '#0d1117', borderRadius: '12px', border: '1px solid #30363d', color: '#c9d1d9', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <h2 style={{ margin: 0, color: '#58a6ff', fontSize: '20px' }}>📊 Live Analytics Feed</h2>
        <div style={{ backgroundColor: '#161b22', padding: '12px 24px', borderRadius: '8px', border: '1px solid #30363d', textAlign: 'center' }}>
          <span style={{ display: 'block', fontSize: '12px', color: '#8b949e', textTransform: 'uppercase', marginBottom: '4px' }}>Total Processed</span>
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3fb950' }}>{stats.total.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ backgroundColor: '#161b22', borderRadius: '8px', border: '1px solid #30363d', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
          <thead>
            <tr style={{ backgroundColor: '#21262d', borderBottom: '1px solid #30363d' }}>
              <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal' }}>ID</th>
              <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal' }}>Event Type</th>
              <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal' }}>User ID</th>
              <th style={{ padding: '12px 16px', color: '#8b949e', fontWeight: 'normal' }}>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {stats.data.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px', textAlign: 'center', color: '#8b949e' }}>
                  Waiting for events to arrive...
                </td>
              </tr>
            ) : (
              stats.data.map((ev) => (
                <tr key={ev.id} style={{ borderBottom: '1px solid #30363d' }}>
                  <td style={{ padding: '12px 16px', color: '#79c0ff' }}>#{ev.id}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ backgroundColor: 'rgba(88,166,255,0.1)', color: '#58a6ff', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>
                      {ev.eventType}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#e6edf3' }}>{ev.userId}</td>
                  <td style={{ padding: '12px 16px', color: '#8b949e', fontSize: '13px' }}>
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}