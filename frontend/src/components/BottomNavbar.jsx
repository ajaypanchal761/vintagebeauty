import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BottomNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/products' || location.pathname.startsWith('/shop')) return 'Shop All';
    if (location.pathname === '/deals' || location.pathname.startsWith('/combo-deals')) return 'Deals';
    if (location.pathname === '/account') return 'Account';
    return 'Home';
  };

  const activeTab = getActiveTab();

  const handleTabClick = (tab, path) => {
    navigate(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black to-gray-900 border-t border-[#D4AF37]/20 z-50 md:hidden backdrop-blur-lg shadow-2xl">
      <div className="flex items-center justify-around px-1 py-1 safe-area-inset-bottom">
        {/* Home */}
        <button 
          onClick={() => handleTabClick('Home', '/')}
          className="flex flex-col items-center gap-0 px-2 py-0.5 relative group transition-all duration-300"
        >
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'Home' ? 'bg-[#D4AF37] opacity-100' : 'bg-transparent opacity-0'}`}></div>
          <div className={`p-1 rounded-lg transition-all duration-300 ${activeTab === 'Home' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`}>
            {activeTab === 'Home' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )}
          </div>
          <span className={`text-[8px] font-medium transition-all duration-300 ${activeTab === 'Home' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Home</span>
        </button>

        {/* Shop All */}
        <button 
          onClick={() => handleTabClick('Shop All', '/products')}
          className="flex flex-col items-center gap-0 px-2 py-0.5 relative group transition-all duration-300"
        >
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'Shop All' ? 'bg-[#D4AF37] opacity-100' : 'bg-transparent opacity-0'}`}></div>
          <div className={`p-1 rounded-lg transition-all duration-300 ${activeTab === 'Shop All' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`}>
            {activeTab === 'Shop All' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            )}
          </div>
          <span className={`text-[8px] font-medium transition-all duration-300 ${activeTab === 'Shop All' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Shop All</span>
        </button>

        {/* Deals */}
        <button 
          onClick={() => handleTabClick('Deals', '/deals')}
          className="flex flex-col items-center gap-0 px-2 py-0.5 relative group transition-all duration-300"
        >
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'Deals' ? 'bg-[#D4AF37] opacity-100' : 'bg-transparent opacity-0'}`}></div>
          <div className={`p-1 rounded-lg transition-all duration-300 ${activeTab === 'Deals' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`}>
            {activeTab === 'Deals' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            )}
          </div>
          <span className={`text-[8px] font-medium transition-all duration-300 ${activeTab === 'Deals' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Deals</span>
        </button>

        {/* Account */}
        <button 
          onClick={() => handleTabClick('Account', '/account')}
          className="flex flex-col items-center gap-0 px-2 py-0.5 relative group transition-all duration-300"
        >
          <div className={`absolute top-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 rounded-full transition-all duration-300 ${activeTab === 'Account' ? 'bg-[#D4AF37] opacity-100' : 'bg-transparent opacity-0'}`}></div>
          <div className={`p-1 rounded-lg transition-all duration-300 ${activeTab === 'Account' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'text-gray-400 group-hover:text-[#D4AF37]'}`}>
            {activeTab === 'Account' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
          <span className={`text-[8px] font-medium transition-all duration-300 ${activeTab === 'Account' ? 'text-[#D4AF37]' : 'text-gray-400'}`}>Account</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNavbar;

