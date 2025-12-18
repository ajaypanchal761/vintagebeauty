import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo vintage.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-gradient-to-b from-black via-gray-900 to-black border-t border-gray-800 mt-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-10 lg:py-12">
        {/* Top section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 md:gap-10">
          {/* Brand */}
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2 mb-3">
              {logo && (
                <img
                  src={logo}
                  alt="Vintage Beauty"
                  className="h-7 md:h-9 w-auto"
                />
              )}
              <span className="text-lg md:text-xl font-semibold tracking-[0.15em] uppercase text-white">
                Vintage Beauty
              </span>
            </div>
            <p className="text-xs md:text-sm text-gray-400 max-w-sm">
              Premium perfumes, room sprays and grooming essentials crafted to
              bring luxury, confidence and long‑lasting fragrances to your
              everyday moments.
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex-1 min-w-[180px]">
            <h4 className="text-sm md:text-base font-semibold text-white mb-3">
              Quick Links
            </h4>
            <div className="flex flex-wrap gap-2 md:gap-3 text-xs md:text-sm">
              <Link
                to="/products"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                Shop All
              </Link>
              <Link
                to="/deals"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                Combo Deals
              </Link>
              <Link
                to="/blogs"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                Blogs
              </Link>
              <Link
                to="/account"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                My Account
              </Link>
              <Link
                to="/track-order"
                className="text-gray-400 hover:text-[#D4AF37] transition-colors"
              >
                Track Order
              </Link>
            </div>
          </div>

          {/* Contact & Support */}
          <div className="flex-1 min-w-[220px]">
            <h4 className="text-sm md:text-base font-semibold text-white mb-3">
              Need Help?
            </h4>
            <div className="space-y-1.5 text-xs md:text-sm text-gray-400">
              <p>
                WhatsApp Support:{' '}
                <a
                  href="https://wa.me/918882815969"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#D4AF37] font-medium hover:underline"
                >
                  +91 88828 15969
                </a>
              </p>
              <p>
                Email:{' '}
                <a
                  href="mailto:beautyvintage63@gmail.com"
                  className="text-[#D4AF37] hover:underline"
                >
                  beautyvintage63@gmail.com
                </a>
              </p>
              <p className="text-[11px] md:text-xs text-gray-500">
                Mon – Sat, 10:00 AM – 7:00 PM IST
              </p>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 mt-8 pt-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-[11px] md:text-xs text-gray-500">
          <p>
            © {currentYear} Vintage Beauty. All Rights Reserved.
          </p>
          <div className="flex flex-wrap gap-3 md:gap-4">
            <span>Made with care in India</span>
            <span className="hidden md:inline">•</span>
            <span>Secure Payments</span>
            <span className="hidden md:inline">•</span>
            <span>COD Available</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


