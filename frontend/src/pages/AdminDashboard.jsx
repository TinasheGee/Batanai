import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import Header from '../components/Header';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to load admin stats', err?.response || err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <Header title="Admin Dashboard" />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-2xl font-semibold mb-4">Admin Dashboard</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-500">Users</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.users ?? '—'}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-500">Businesses</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.businesses ?? '—'}
            </p>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <p className="text-sm text-gray-500">Products</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {stats?.products ?? '—'}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
