import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function UserProfileDropdown({ user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="relative inline-block text-left z-50">
      {/* Trigger Pill */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 bg-white px-2 py-1 pr-4 rounded-full shadow-md border-2 border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors"
      >
        {user.profile_image ? (
          <img
            src={user.profile_image}
            alt={user.full_name}
            className="w-10 h-10 rounded-full object-cover border-2 border-brand-900"
            onError={(e) => {
              e.target.onerror = null;
              // Fallback to SVG by hiding the img and showing the div below?
              // Simpler to just use a fallback generic avatar URL
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name)}`;
            }}
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-brand-900 flex items-center justify-center text-white border-2 border-brand-900">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
        )}

        <div className="flex flex-col items-start leading-tight">
          <span className="text-sm font-bold text-gray-900">
            {user.full_name}
          </span>
          {user.role !== 'BUSINESS' && (
            <span className="text-xs font-bold text-brand-800 uppercase tracking-wider">
              {user.role}
            </span>
          )}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-xl bg-white ring-1 ring-black ring-opacity-5 focus:outline-none overflow-hidden z-50">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.full_name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <div className="py-1">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
              >
                <span></span> Profile View
              </button>
              <button
                onClick={() => navigate('/settings')}
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-100 gap-2"
              >
                <span></span> Settings
              </button>
              <div className="border-t border-gray-100 my-1"></div>
              <button
                onClick={handleLogout}
                className="flex items-center w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 gap-2"
              >
                <span></span> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
