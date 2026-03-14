import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import logo from '../styles/images/logo.png';
import SiteEditForm from '../components/SiteEditForm';
import api from '../api/axios';

export default function ContactUs() {
  const [business, setBusiness] = useState(null);
  const [siteInfo, setSiteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editingSite, setEditingSite] = useState(false);
  const [form, setForm] = useState({
    email: '',
    phone_number: '',
    category: '',
    employee_count: '',
    website: '',
    location: '',
  });
  const role = localStorage.getItem('role') || sessionStorage.getItem('role');
  const provisional = {
    email: 'contact@batanai.co.zw',
    phone_number: '+263 77 000 0000',
    category: 'General Business',
    employee_count: '10 - 50 Employees',
    website: 'www.batanai.co.zw',
    location: '1 Main St, Harare, Zimbabwe',
    name: 'Batanai',
    logo_url: '',
  };

  useEffect(() => {
    const fetchBusinessAndSite = async () => {
      try {
        // Try fetch business for logged-in business users
        try {
          const res = await api.get('/user/dashboard');
          if (res.data.businesses && res.data.businesses.length > 0) {
            setBusiness(res.data.businesses[0]);
            const b = res.data.businesses[0];
            setForm({
              email: b.email || '',
              phone_number: b.phone_number || '',
              category: b.category || '',
              employee_count: b.employee_count || '',
              website: b.website || '',
              location: b.location || '',
            });
          }
        } catch (e) {
          // ignore - user may not be a business or not logged in
        }

        // Fetch public site info (contact details) for customers
        try {
          const s = await api.get('/admin/public/site-settings');
          setSiteInfo(s.data || {});
        } catch (e) {
          // ignore if not available
        }
      } catch (err) {
        console.error('Failed to load contact data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusinessAndSite();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent font-sans pb-10">
        <Header title="Contact Us" />
        <div className="flex justify-center items-center h-96">
          <div className="text-xl text-gray-500 font-semibold">
            Loading contact details...
          </div>
        </div>
      </div>
    );
  }

  // Use business info when available, otherwise fall back to public siteInfo or provisional content
  const display = business || siteInfo || provisional;

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header title="Contact Us" />
      {/* Main Container - Site Owner Layout */}
      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-[40px] shadow-lg p-12 mb-8 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-white opacity-60"></div>
          <div className="relative z-10 text-center">
            {display.logo_url && !display.logo_url.includes('placeholder') ? (
              <img
                src={display.logo_url}
                alt={display.name || 'Batanai'}
                className="max-h-40 mx-auto object-contain drop-shadow-md"
              />
            ) : (
              <img
                src={logo}
                alt="Batanai"
                className="max-h-40 mx-auto object-contain drop-shadow-md"
              />
            )}
            <p className="text-gray-600 mt-3 text-lg">
              Welcome to {display.name || 'Batanai'}. We connect customers with
              reliable local businesses and surface daily deals across Zimbabwe.
              For platform enquiries, partnerships, or press, please contact us
              below.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-4 bg-white rounded-full shadow-md px-6 py-4">
            <div className="bg-black text-white p-3 rounded-full">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Email</div>
              <div className="font-bold text-gray-800">
                {display.email || 'No email provided'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white rounded-full shadow-md px-6 py-4">
            <div className="bg-black text-white p-3 rounded-full">
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
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Phone</div>
              <div className="font-bold text-gray-800">
                {display.phone_number || '+263 77 123 4567'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white rounded-full shadow-md px-6 py-4">
            <div className="bg-black text-white p-3 rounded-full">
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Website</div>
              <a
                href={`https://${display.website || 'www.batanai.co.zw'}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-gray-800 hover:text-blue-600"
              >
                {display.website || 'www.batanai.co.zw'}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white rounded-full shadow-md px-6 py-4">
            <div className="bg-black text-white p-3 rounded-full">
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
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Location</div>
              <div className="font-bold text-gray-800 truncate">
                {display.location || 'Harare, Zimbabwe'}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-center mt-6">
          <div className="flex gap-4">
            <button
              className="bg-[#0047AB] text-white text-lg font-bold py-3 px-6 rounded-full shadow hover:bg-blue-800 transition"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display.location || '')}`,
                  '_blank'
                )
              }
            >
              View Location
            </button>
            {role === 'admin' && (
              <button
                className="bg-yellow-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow hover:bg-yellow-700 transition"
                onClick={() => setEditingSite(true)}
              >
                Edit Site Info
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Edit Site Info Modal (admin only) */}
      {editingSite && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Site Contact Info</h3>
            <SiteEditForm
              initial={siteInfo}
              onCancel={() => setEditingSite(false)}
              onSave={async (updated) => {
                try {
                  await api.patch('/admin/site-settings', updated);
                  const s = await api.get('/admin/public/site-settings');
                  setSiteInfo(s.data || {});
                  setEditingSite(false);
                } catch (err) {
                  console.error('Failed to save site info', err);
                  alert('Failed to save site info');
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
