import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Header from '../components/Header';

export default function BusinessDashboard() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/user/dashboard');
      setDashboardData(res.data);
      // also fetch current user profile to show avatar
      try {
        const me = await api.get('/user/me');
        setUser(me.data);
      } catch (e) {
        // ignore user fetch errors
      }
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-400 font-sans">
        Loading dashboard...
      </div>
    );

  // Derive business name (use the first one found or default)
  const businessName =
    dashboardData?.businesses?.length > 0
      ? dashboardData.businesses[0].name
      : 'Business Dashboard';

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title={businessName} />

      <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-8 px-6">
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 h-fit sticky top-28">
          <h3 className="font-extrabold text-gray-800 text-lg mb-6 flex items-center gap-2 border-b border-gray-100 pb-4">
            <span className="text-xl"></span> Management
          </h3>
          <div className="flex flex-col gap-2">
            <button className="flex items-center gap-3 px-4 py-3 bg-brand-200 text-brand-600 rounded-xl font-semibold text-sm">
              <span></span> Overview
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-left hover:text-brand-600"
            >
              <span></span> My Products
            </button>
            <button
              onClick={() => navigate('/messaging')}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-left hover:text-brand-600"
            >
              <span></span> Messages
            </button>
            <button
              onClick={() => navigate('/profile')}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-left hover:text-brand-600"
            >
              <span></span> Profile
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-xl font-medium text-sm transition-colors text-left hover:text-brand-600"
            >
              <span></span> Settings
            </button>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex flex-col gap-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-brand-200/50 border border-brand-200 p-6 rounded-2xl text-center shadow-sm">
              <h3 className="text-gray-800 font-bold text-lg mb-1 truncate">
                {dashboardData?.businesses[0]?.name || 'My Store'}
              </h3>
              <p className="text-brand-600 text-sm font-medium">
                Active Branch
              </p>
            </div>
            <div className="bg-green-50/50 border border-green-100 p-6 rounded-2xl text-center shadow-sm">
              <h1 className="text-4xl font-extrabold text-green-600 my-2">
                {dashboardData?.submissions?.length || 0}
              </h1>
              <p className="text-green-800 text-sm font-medium">
                Total Products
              </p>
            </div>
            <div className="bg-orange-50/50 border border-orange-100 p-6 rounded-2xl text-center shadow-sm">
              <h1 className="text-4xl font-extrabold text-orange-500 my-2">
                0
              </h1>
              <p className="text-orange-800 text-sm font-medium">
                Orders Today
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-wrap gap-4">
              <button
                className="flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-semibold shadow-lg hover:bg-brand-500 transition-all hover:scale-105"
                onClick={() => navigate('/marketplace')}
              >
                <span>+</span> Add New Product
              </button>
              <button
                className="flex items-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
                onClick={() => navigate('/messaging')}
              >
                <span></span> View Messages
              </button>
            </div>
          </div>

          {/* Recent Reviews (Placeholder) */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 opacity-60">
            <h3 className="font-bold text-gray-800 text-lg mb-4">
              Recent Reviews (Coming Soon)
            </h3>
            <div className="text-gray-400 text-sm italic py-4 text-center border-2 border-dashed border-gray-100 rounded-xl">
              No reviews yet.
            </div>
          </div>
        </main>

        {/* RIGHT DASHBOARD (Helper) */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-32 h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <div className="mini-avatar" style={{ marginLeft: 'auto' }}>
              <img
                src={
                  user?.profile_image ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    (user && (user.full_name || user.name)) || 'User'
                  )}&background=random&color=fff&rounded=true`
                }
                alt="Profile"
              />
            </div>
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 hover:cursor-not-allowed text-gray-900 font-bold shadow-md transition-all text-center">
                Jobs/Opportunities
              </button>
              <button
                onClick={() => navigate('/network')}
                className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center"
              >
                My Network
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
