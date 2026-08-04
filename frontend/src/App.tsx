import PipeLineCanvas from './components/PipeLineCanvas';
import { DashboardStats } from './components/DashboardStats';

function App() {
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      {/* אזור הקנבס המרכזי */}
      <div className="flex-1 relative">
        <PipeLineCanvas />
      </div>

      {/* פאנל צדדי המציג את הסטטיסטיקות החיות מ-Redis */}
      <div className="w-96 border-l border-gray-800 bg-gray-900 p-4 overflow-y-auto">
        <DashboardStats />
      </div>
    </div>
  );
}

export default App;