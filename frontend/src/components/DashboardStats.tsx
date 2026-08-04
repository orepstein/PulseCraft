import React, { useEffect, useState } from 'react';

interface StatsData {
  totalEvents: number;
  eventTypes: Record<string, string>;
}

export const DashboardStats: React.FC = () => {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/stats');
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      const data = await response.json();
      setStats(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Connection error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="text-gray-400 p-4">Loading live stats...</div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="bg-gray-900 text-white p-6 rounded-xl shadow-lg border border-gray-800">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
        Real-Time Pipeline Stats (Redis)
      </h2>
      
      <div className="grid grid-cols-1 gap-4 mb-6">
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-sm text-gray-400">Total Events Processed</p>
          <p className="text-3xl font-extrabold text-blue-400">{stats?.totalEvents || 0}</p>
        </div>
      </div>

      <h3 className="text-md font-semibold mb-2 text-gray-300">Event Types Breakdown</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {stats?.eventTypes && Object.keys(stats.eventTypes).length > 0 ? (
          Object.entries(stats.eventTypes).map(([type, count]) => (
            <div key={type} className="flex justify-between items-center bg-gray-800 px-4 py-2 rounded">
              <span className="font-mono text-sm text-indigo-300 truncate max-w-[180px]">{type}</span>
              <span className="bg-indigo-600 px-2.5 py-0.5 rounded-full text-xs font-bold">{count}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-500">No event types recorded yet.</p>
        )}
      </div>
    </div>
  );
};