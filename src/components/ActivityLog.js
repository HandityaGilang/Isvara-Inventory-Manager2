import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';

const ActivityLog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (user?.role === 'STAFF') {
      navigate('/inventory');
    }
  }, [user, navigate]);

  const [activities, setActivities] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLogs = async () => {
      try {
        const loadedLogs = await db.logs.getAll();
        if (Array.isArray(loadedLogs)) {
          const sorted = [...loadedLogs].sort(
            (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
          );
          const visible =
            user?.role === 'ADMIN' && user?.mode === 'ONLINE'
              ? sorted.filter((a) => a.user === user.username)
              : sorted;
          setActivities(visible);
        } else {
          setActivities([]);
        }
      } catch (error) {
        console.error('Failed to load activity log:', error);
        setActivities([]);
      }
    };

    loadLogs();
  }, [user]);

  const filteredActivities = activities.filter((activity) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      (activity.user || '').toLowerCase().includes(q) ||
      (activity.action || '').toLowerCase().includes(q) ||
      (activity.item || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Activity Log
          </h1>
          <p className="text-gray-600">
            Riwayat aktivitas pengguna sistem
          </p>
        </div>
        <div className="flex space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari aktivitas..." 
              className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Waktu</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Detail Perubahan</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${activity.role === 'OWNER' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                      {activity.user}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {activity.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {activity.item}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center space-x-2">
                      <span className="text-red-500 bg-red-50 px-2 py-1 rounded">{activity.oldVal ?? '-'}</span>
                      <span className="text-gray-400">→</span>
                      <span className="text-blue-500 bg-blue-50 px-2 py-1 rounded">{activity.newVal}</span>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                  Tidak ada aktivitas ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ActivityLog;