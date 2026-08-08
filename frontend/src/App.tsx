import { DashboardStats } from './components/DashboardStats';
import { SignalFlowCanvas } from './components/SignalFlowCanvas';

export default function App() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#010409', padding: '32px', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <header style={{ marginBottom: '32px' }}>
          <h1 style={{ color: '#c9d1d9', margin: '0 0 8px 0', fontSize: '28px' }}>
            PulseCraft <span style={{ color: '#58a6ff' }}>DevTool</span>
          </h1>
          <p style={{ color: '#8b949e', margin: 0 }}>Real-time Data Pipeline Monitor</p>
        </header>

        {/* 1. קנבס זרימת הנתונים הוויזואלי (הרכיב החדש) */}
        <SignalFlowCanvas />

        {/* 2. דאשבורד הנתונים מ-PostgreSQL (הרכיב הקודם) */}
        <DashboardStats />

      </div>
    </div>
  );
}