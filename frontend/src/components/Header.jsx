import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../styles/images/logo.png';
import UserProfileDropdown from './UserProfileDropdown';
import api from '../api/axios';

export default function Header({ title, logoUrl, forceTitle = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Show admin link when user is admin
  if (
    user &&
    (user.role === 'admin' || (user.role || '').toLowerCase() === 'admin')
  ) {
    navItems.push({ label: 'Admin', path: '/admin' });
  }

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
    <div className="w-full max-w-[1600px] mx-auto pt-0 px-2 lg:px-4 sticky top-0 z-[100]">
      {/* Admin topbar - visible only to admins */}
      {user &&
        (user.role === 'admin' ||
          (user.role || '').toLowerCase() === 'admin') && (
          <div className="w-full px-2 lg:px-4">
            <div className="max-w-[1600px] mx-auto py-2">
              <nav className="flex items-center justify-between bg-white/90 border border-gray-100 rounded-2xl shadow-sm px-3 py-1.5">
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 font-semibold text-sm">
                    A
                  </span>
                  <div className="text-sm font-semibold text-gray-700">
                    Admin
                  </div>
                  <span className="hidden sm:inline-block text-xs text-gray-400">
                    Dashboard
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigate('/admin')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border ${
                      isActive('/admin')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => navigate('/admin/users')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border ${
                      isActive('/admin/users')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Users
                  </button>
                  <button
                    onClick={() => navigate('/admin/businesses')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border ${
                      isActive('/admin/businesses')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Businesses
                  </button>
                  <button
                    onClick={() => navigate('/admin/malls/list')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border ${
                      isActive('/admin/malls') || isActive('/admin/malls/list')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Malls
                  </button>
                  <button
                    onClick={() => navigate('/admin/products')}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150 border ${
                      isActive('/admin/products')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Products
                  </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      {/* Main Header Container - Glassmorphism Pill */}
      <div className="bg-slate-200/80 backdrop-blur-md rounded-full shadow-lg border border-white/40 px-2 lg:px-3 py-2 flex items-center justify-between min-h-[60px] lg:min-h-[80px]">
        {/* Left: Logo - Overlapping effect */}
        <div className="flex-shrink-0 relative pl-1 lg:pl-2">
          <button
            onClick={() => navigate('/home')}
            className="p-0 bg-transparent border-0 cursor-pointer"
            aria-label="Go to home"
          >
            <img
              src={
                logoUrl ||
                user?.logo_url ||
                user?.business_logo ||
                user?.logo ||
                logo
              }
              alt={user?.business_name || 'Batanai'}
              className="h-10 lg:h-16 w-auto object-contain drop-shadow-sm transform hover:scale-105 transition-transform"
            />
          </button>
        </div>

        {/* Center: Title & Nav Stack - Desktop */}
        <div className="hidden lg:flex flex-col items-center justify-center flex-1 px-4 gap-1">
          {/* Dynamic Title */}
          <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">
            {title && forceTitle
              ? title
              : user?.role === 'BUSINESS' && user?.business_name
                ? user.business_name
                : title}
          </h1>

          {/* Navigation Pills - Desktop */}
          <div className="flex items-center gap-20 mt-1">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`
                        px-8 py-1.5 rounded-full text-sm font-bold transition-all duration-200 border
                        ${
                          isActive(item.path)
                            ? 'bg-brand-600 text-white border-brand-600 shadow-md ring-2 ring-brand-200'
                            : 'bg-gradient-to-b from-white to-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100 hover:shadow-sm'
                        }
                     `}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Title - Centered and truncated */}
        <div className="flex lg:hidden flex-1 justify-center items-center px-2 min-w-0">
          <h1
            className="text-sm font-bold text-gray-900 tracking-tight text-center"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {title && forceTitle
              ? title
              : user?.role === 'BUSINESS' && user?.business_name
                ? user.business_name
                : title}
          </h1>
        </div>

        {/* Hamburger Menu Button - Mobile */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden flex-shrink-0 p-2 rounded-full hover:bg-white/50 transition-all"
          aria-label="Toggle menu"
        >
          <svg
            className="w-6 h-6 text-gray-900"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {mobileMenuOpen ? (
              <path d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>

        {/* Right: Profile - keep visible on all sizes for consistent top-right avatar */}
        <div
          className="flex-shrink-0 pr-2"
          style={{ minWidth: 180, display: 'flex', justifyContent: 'flex-end' }}
        >
          <UserProfileDropdown
            user={user || { full_name: 'User', role: '', profile_image: '' }}
          />
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden mt-2 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-gray-200 overflow-hidden">
          <div className="flex flex-col p-4 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileMenuOpen(false);
                }}
                className={`
                  w-full px-6 py-3 rounded-full text-base font-bold transition-all duration-200 border text-left
                  ${
                    isActive(item.path)
                      ? 'bg-brand-600 text-white border-brand-600 shadow-md'
                      : 'bg-gradient-to-b from-white to-gray-50 text-gray-800 border-gray-300 hover:bg-gray-100'
                  }
                `}
              >
                {item.label}
              </button>
            ))}
            {/* User Profile in Mobile Menu */}
            <div className="pt-2 border-t border-gray-200 mt-2">
              <UserProfileDropdown user={user} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
