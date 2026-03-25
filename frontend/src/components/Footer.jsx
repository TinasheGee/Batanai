import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 w-full bg-white/40 backdrop-blur-md border-t border-gray-200 z-50">
      <div className="max-w-[1600px] mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="text-sm text-black text-left md:text-left">
          © {new Date().getFullYear()} Batanai. All rights reserved.
        </div>

        <div className="flex items-center gap-4 text-sm text-black">
          <Link to="/terms" className="hover:underline text-black">
            <span className="hover:underline">Terms &amp; Conditions</span>
          </Link>
          <Link to="/faqs" className="hover:underline text-black">
            FAQs
          </Link>
          <Link to="/about" className="hover:underline text-black">
            About Us
          </Link>
          <Link to="/contact-us" className="hover:underline text-black">
            Contact Us
          </Link>
        </div>
      </div>
    </footer>
  );
}
