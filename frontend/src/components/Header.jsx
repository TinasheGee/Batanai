import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../styles/images/logo.png';
import UserProfileDropdown from './UserProfileDropdown';
import api from '../api/axios';

export default function Header({ title }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/user/me');
        setUser(res.data);
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, []);

  const navItems = [
    { label: 'Home', path: '/home' },
    { label: 'Marketplace', path: '/marketplace' },
    { label: 'Messaging', path: '/messaging' },
    { label: 'My Network', path: '/network' },
  ];

  // Helper to check active state
  const isActive = (path) => {
    // Exact match or sub-paths if needed
    if (
      path === '/home' &&
      (location.pathname === '/home' ||
        location.pathname === '/business-dashboard')
    )
      return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-full max-w-[1600px] mx-auto pt-3 px-4 sticky top-0 z-[100]">
      {/* Main Header Container - Glassmorphism Pill */}
      <div className="bg-slate-200/80 backdrop-blur-md rounded-full shadow-lg border border-white/40 px-3 py-2 flex items-center justify-between min-h-[80px]">
        {/* Left: Logo - Overlapping effect */}
        <div className="flex-shrink-0 relative pl-2">
          <img
            src={logo}
            alt="Batanai"
            className="h-16 w-auto object-contain drop-shadow-sm transform hover:scale-105 transition-transform"
          />
        </div>

        {/* Center: Title & Nav Stack */}
        <div className="flex flex-col items-center justify-center flex-1 px-4 gap-1">
          {/* Dynamic Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight hidden md:block">
            {user?.role === 'BUSINESS' && user?.business_name
              ? user.business_name
              : title}
          </h1>

          {/* Navigation Pills */}
          <div className="flex items-center gap-20 mt-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                        px-8 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border
                        ${
                          isActive(item.path)
                            ? 'bg-[#0047AB] text-white border-[#0047AB] shadow-md ring-2 ring-blue-200'
                            : 'bg-gradient-to-b from-white to-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100 hover:shadow-sm'
                        }
                     `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Profile */}
        <div className="flex-shrink-0 pr-2">
          <UserProfileDropdown user={user} />
        </div>
      </div>
    </div>
  );
}
