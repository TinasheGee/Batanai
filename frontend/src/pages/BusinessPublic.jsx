import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from '../components/Header';
import logo from '../styles/images/logo.png';
import api from '../api/axios';

export default function BusinessPublic() {
  const { id } = useParams();
  const [business, setBusiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusiness = async () => {
      try {
        const res = await api.get(`/business/${id}`);
        setBusiness(res.data || null);
      } catch (err) {
        console.error('Failed to load business', err);
        setBusiness(null);
      } finally {
        setLoading(false);
      }
    };
    fetchBusiness();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent font-sans pb-10">
        <Header title="Business" />
        <div className="flex items-center justify-center h-96">
          <div className="text-xl text-gray-500 font-semibold">Loading...</div>
        </div>
      </div>
    );
  }

  const display = business || {};
  const logoUrl =
    display.logo_url ||
    display.logo ||
    display.logoUrl ||
    display.logo_url_full ||
    display.logo_full ||
    null;

  return (
    <div className="min-h-screen bg-transparent font-sans pb-10">
      <Header
        title={display?.name || 'Business'}
        logoUrl={logoUrl}
        forceTitle={true}
      />

      <div className="max-w-6xl mx-auto px-6 mt-8">
        <div className="bg-white rounded-[40px] shadow-lg p-12 mb-8 flex flex-col items-center justify-center min-h-[260px] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white via-brand-200 to-white opacity-60"></div>
          <div className="relative z-10 text-center">
            {logoUrl && !String(logoUrl).includes('placeholder') ? (
              <img
                src={logoUrl}
                alt={display.name}
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
              {display.name || 'Business'}. {display.description || ''}
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
                className="font-bold text-gray-800 hover:text-brand-600"
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
              className="bg-brand-600 text-white text-lg font-bold py-3 px-6 rounded-full shadow hover:bg-brand-500 transition"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display.location || '')}`,
                  '_blank'
                )
              }
            >
              View Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
