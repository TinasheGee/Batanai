import React, { useState, useEffect } from 'react';
import BusinessLayout from '../components/BusinessLayout';
import api from '../api/axios';

export default function ContactUs() {
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    email: '',
    phone_number: '',
    category: '',
    employee_count: '',
    website: '',
    location: '',
  });

  useEffect(() => {
    const fetchBusiness = async () => {
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
      } catch (err) {
        console.error('Failed to load business data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, []);

  if (loading) {
    return (
      <BusinessLayout title="Contact Us">
        <div className="flex justify-center items-center h-96">
          <div className="text-xl text-gray-500 font-semibold">
            Loading contact details...
          </div>
        </div>
      </BusinessLayout>
    );
  }

  if (!business) {
    return (
      <BusinessLayout title="Contact Us">
        <div className="flex justify-center items-center h-96">
          <div className="text-xl text-gray-500 font-semibold">
            Business details not found.
          </div>
        </div>
      </BusinessLayout>
    );
  }

  return (
    <BusinessLayout title="Contact Us">
      {/* Main Container */}
      <div className="max-w-5xl mx-auto">
        {/* Top Banner / Logo Area */}
        <div className="bg-white rounded-[40px] shadow-lg p-10 mb-8 flex justify-center items-center min-h-[250px] relative overflow-hidden">
          {/* Background decorative elements if needed */}
          <div className="absolute inset-0 bg-gradient-to-br from-white via-blue-50 to-white opacity-50"></div>

          {/* Logo */}
          <div className="relative z-10 transform scale-125">
            {business.logo_url && !business.logo_url.includes('placeholder') ? (
              <img
                src={business.logo_url}
                alt={business.name}
                className="max-h-40 object-contain drop-shadow-md"
              />
            ) : (
              <h1
                className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-yellow-500 to-green-600 drop-shadow-sm tracking-tight"
                style={{ fontFamily: "'Brush Script MT', cursive" }}
              >
                {business.name.split(' ')[0]}
              </h1>
            )}
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Email */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-700 text-lg truncate">
              {business.email || 'No email provided'}
            </span>
          </div>

          {/* Phone */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
            <span className="font-bold text-gray-700 text-lg">
              {business.phone_number || '+263 77 123 4567'}
            </span>
          </div>

          {/* Category / Industry */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-700 text-lg">
              {business.category || 'General Business'}
            </span>
          </div>

          {/* Employees */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-700 text-lg">
              {business.employee_count || '10 - 50 Employees'}
            </span>
          </div>

          {/* Website */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            </div>
            <a
              href={`https://${business.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-gray-700 text-lg hover:text-blue-600 truncate"
            >
              {business.website || 'www.batanai.co.zw'}
            </a>
          </div>

          {/* Location */}
          <div className="bg-white rounded-full shadow-md py-4 px-8 flex items-center gap-4 border border-gray-100 hover:shadow-lg transition">
            <div className="bg-black text-white p-2 rounded-full">
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <span className="font-bold text-gray-700 text-lg truncate">
              {business.location}
            </span>
          </div>
        </div>

        {/* View Location Button */}
        <div className="flex justify-center mt-8">
          <div className="flex gap-4">
            <button
              className="bg-[#0047AB] text-white text-xl font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-800 transition transform hover:scale-105"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(business.location)}`,
                  '_blank'
                )
              }
            >
              View Location
            </button>

            <button
              className="bg-green-600 text-white text-xl font-bold py-3 px-6 rounded-full shadow-lg hover:bg-green-700 transition"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
          </div>
        </div>
      </div>
      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Contact Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                className="p-2 border rounded"
                placeholder="Email"
                value={form.email}
                onChange={(e) =>
                  setForm((f) => ({ ...f, email: e.target.value }))
                }
              />
              <input
                className="p-2 border rounded"
                placeholder="Phone"
                value={form.phone_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, phone_number: e.target.value }))
                }
              />
              <input
                className="p-2 border rounded"
                placeholder="Category"
                value={form.category}
                onChange={(e) =>
                  setForm((f) => ({ ...f, category: e.target.value }))
                }
              />
              <input
                className="p-2 border rounded"
                placeholder="Employees"
                value={form.employee_count}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employee_count: e.target.value }))
                }
              />
              <input
                className="p-2 border rounded"
                placeholder="Website"
                value={form.website}
                onChange={(e) =>
                  setForm((f) => ({ ...f, website: e.target.value }))
                }
              />
              <input
                className="p-2 border rounded"
                placeholder="Location"
                value={form.location}
                onChange={(e) =>
                  setForm((f) => ({ ...f, location: e.target.value }))
                }
              />
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white"
                onClick={async () => {
                  try {
                    const payload = { ...form };
                    // sanitize empty strings to null
                    Object.keys(payload).forEach((k) => {
                      if (payload[k] === '') payload[k] = null;
                    });
                    const res = await api.put(
                      `/business/${business.id}`,
                      payload
                    );
                    setBusiness(res.data);
                    setEditing(false);
                  } catch (err) {
                    console.error('Failed to save business details', err);
                    alert('Failed to save details');
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </BusinessLayout>
  );
}
