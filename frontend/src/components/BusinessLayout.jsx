import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import bgImage from '../styles/images/Lucid_Origin_A_sleek_professional_world_map_vector_illustratio_2.jpg';

export default function BusinessLayout({ children, title }) {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed font-sans pb-10"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <Header title={title} />

      <div className="max-w-[1600px] mx-auto mt-8 grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-8 px-6">
        {/* LEFT SIDEBAR - PROFILE NAV */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-32 h-fit">
          <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-lg border border-white/50">
            <h3 className="mt-0 mb-4 text-xl text-[#0047AB] font-bold text-center">
              Profile
            </h3>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate('/home')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-semibold shadow-sm ${
                  isActive('/home')
                    ? 'bg-[#0047AB] text-white shadow-md'
                    : 'bg-white hover:bg-blue-50 text-gray-700'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Reviews
              </button>
              <button
                onClick={() => navigate('/catalogue')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-semibold shadow-sm ${
                  isActive('/catalogue')
                    ? 'bg-[#0047AB] text-white shadow-md'
                    : 'bg-white hover:bg-blue-50 text-gray-700'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="8" y1="6" x2="21" y2="6"></line>
                  <line x1="8" y1="12" x2="21" y2="12"></line>
                  <line x1="8" y1="18" x2="21" y2="18"></line>
                  <line x1="3" y1="6" x2="3.01" y2="6"></line>
                  <line x1="3" y1="12" x2="3.01" y2="12"></line>
                  <line x1="3" y1="18" x2="3.01" y2="18"></line>
                </svg>
                Catalogue
              </button>
              <button
                onClick={() => navigate('/portfolio')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-semibold shadow-sm ${
                  isActive('/portfolio')
                    ? 'bg-[#0047AB] text-white shadow-md'
                    : 'bg-white hover:bg-blue-50 text-gray-700'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                  <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
                Portfolio
              </button>
              <button
                onClick={() => navigate('/contact-us')}
                className={`flex items-center gap-3 w-full p-3 rounded-xl transition-all text-sm font-semibold shadow-sm ${
                  isActive('/contact-us')
                    ? 'bg-[#0047AB] text-white shadow-md'
                    : 'bg-white hover:bg-blue-50 text-gray-700'
                }`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
                </svg>
                Contact Us
              </button>
            </div>
          </div>
        </aside>

        {/* CENTER CONTENT */}
        <main className="min-w-0">{children}</main>

        {/* RIGHT SIDEBAR - DASHBOARD */}
        <aside className="hidden lg:flex flex-col gap-5 sticky top-32 h-fit">
          <div className="bg-white/40 backdrop-blur-md rounded-2xl p-6 shadow-lg border border-white/50 w-full">
            <h3 className="mt-0 mb-4 text-lg text-gray-800 font-bold pb-2 text-center">
              Dashboard (coming soon)
            </h3>

            <div className="flex flex-col gap-3">
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Looking For
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
                Selling
              </button>
              <button className="w-full py-2.5 px-4 rounded-full bg-gray-400 hover:bg-gray-500 text-gray-900 font-bold shadow-md transition-all text-center">
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
