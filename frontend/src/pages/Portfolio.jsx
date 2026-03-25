import React from 'react';
import BusinessLayout from '../components/BusinessLayout';

export default function Portfolio() {
  return (
    <BusinessLayout title="Our Portfolio">
      <div className="bg-white/90 backdrop-blur-md rounded-3xl p-8 shadow-xl border border-white/60 min-h-[600px]">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-brand-600">Recent Work</h2>
          <span className="text-gray-500 font-medium">
            Showcasing our best projects
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="group cursor-pointer">
            <div className="bg-gray-200 h-64 rounded-xl mb-4 overflow-hidden relative shadow-md">
              <div className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold">
                View Project
              </div>
            </div>
            <h3 className="font-bold text-xl text-gray-800 group-hover:text-brand-600 transition">
              Project Alpha
            </h3>
            <p className="text-gray-600 mt-1">Web Development</p>
          </div>
          <div className="group cursor-pointer">
            <div className="bg-gray-200 h-64 rounded-xl mb-4 overflow-hidden relative shadow-md">
              <div className="absolute inset-0 bg-brand-900/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white font-bold">
                View Project
              </div>
            </div>
            <h3 className="font-bold text-xl text-gray-800 group-hover:text-brand-600 transition">
              Project Beta
            </h3>
            <p className="text-gray-600 mt-1">Mobile App Design</p>
          </div>
        </div>
      </div>
    </BusinessLayout>
  );
}
