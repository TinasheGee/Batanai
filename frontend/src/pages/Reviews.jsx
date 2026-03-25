import React from 'react';
import BusinessLayout from '../components/BusinessLayout';

export default function Reviews() {
  return (
    <BusinessLayout title="Business Reviews">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 min-h-[600px]">
        <h2 className="text-2xl font-bold text-brand-600 mb-4">Reviews</h2>
        <p className="text-gray-600 mb-6">
          See what our customers are saying about us.
        </p>

        {/* Mock Content */}
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-800">John Doe</span>
              <span className="text-yellow-500">★★★★☆</span>
            </div>
            <p className="text-gray-600">Great service!</p>
          </div>
          <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between mb-2">
              <span className="font-bold text-gray-800">Jane Smith</span>
              <span className="text-yellow-500">★★★★★</span>
            </div>
            <p className="text-gray-600">Excellent quality products.</p>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
