import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  ShoppingBag, 
  Package, 
  Users, 
  LogOut,
  Tag,
  Menu,
  X,
  Presentation,
  File,
  Settings,
  User,
  FileText,
  Bell,
  Heart,
  CreditCard,
  RefreshCw,
  DollarSign,
  MessageSquare,
  BarChart3
} from 'lucide-react';

const SidebarLayout = ({ children }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path) => {
    return location.pathname === path;
  };

  const menuItems = [
    { path: '/admin', icon: <ShoppingBag size={20} />, label: 'Dashboard' },
    { path: '/admin/products', icon: <Package size={20} />, label: 'Products' },
    { path: '/admin/hero-carousel', icon: <Presentation size={20} />, label: 'Hero Carousel' },
    { path: '/admin/combo-deals', icon: <Presentation size={20} />, label: 'Combo Deals' },
    { path: '/admin/categories', icon: <Tag size={20} />, label: 'Categories' },
    { path: '/admin/orders', icon: <Users size={20} />, label: 'Orders' },
    { path: '/admin/users', icon: <User size={20} />, label: 'Users' },
    { path: '/admin/user-analytics', icon: <BarChart3 size={20} />, label: 'User Analytics' },
    { path: '/admin/wishlist', icon: <Heart size={20} />, label: 'Wishlists' },
    { path: '/admin/blogs', icon: <FileText size={20} />, label: 'Blogs' },
    { path: '/admin/announcements', icon: <Bell size={20} />, label: 'Announcements' },
    { path: '/admin/customer-support', icon: <MessageSquare size={20} />, label: 'Customer Support' },
    { path: '/admin/data', icon: <File size={20} />, label: 'Pages' },
    { path: '/admin/coupons', icon: <Users size={20} />, label: 'Coupons' },
    { path: '/admin/payment-history', icon: <CreditCard size={20} />, label: 'Payment History' },
    { path: '/admin/refund-management', icon: <RefreshCw size={20} />, label: 'Refund Management' },
    { path: '/admin/revenue-settlement', icon: <DollarSign size={20} />, label: 'Revenue Settlement' },
    { path: '/admin/settings', icon: <Settings size={20} />, label: 'Settings' },
    { path: '/admin/profile', icon: <User size={20} />, label: 'Profile' },
  ];

  const handleLogout = () => {
    // Clear all admin authentication data
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin_logged_in');
    // Redirect to login page
    window.location.href = '/admin/login';
  };

  return (
    <>
      <style>{`
        /* Fixed sidebar - always fixed, never static */
        .admin-sidebar-fixed {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: 16rem; /* w-64 = 16rem */
          z-index: 50;
        }
        
        /* Sidebar scroll area */
        .admin-sidebar-scroll {
          height: 100vh;
          overflow-x: hidden;
          display: flex;
          flex-direction: column;
        }
        
        /* Navigation area - scrollable */
        .admin-sidebar-nav {
          flex: 1 1 auto;
          overflow-y: auto;
          overflow-x: hidden;
          min-height: 0;
        }
        
        /* Main content area - shifted by sidebar width on desktop */
        .admin-main-content {
          height: 100vh;
          overflow-y: auto;
          overflow-x: hidden;
          margin-left: 0;
          position: relative;
          z-index: 1;
        }
        
        /* Ensure main content is visible behind overlay on mobile */
        @media (max-width: 1023px) {
          .admin-main-content {
            z-index: 1;
            position: relative;
          }
        }
        
        @media (min-width: 1024px) {
          .admin-main-content {
            margin-left: 16rem; /* matches sidebar width */
          }
        }
        
        /* Ensure flex children can shrink for scrolling */
        .admin-flex-shrink {
          min-height: 0;
        }
      `}</style>
      
      {/* Mobile Menu Overlay - Very light overlay to show background content clearly */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-transparent bg-opacity-10 z-[45] lg:hidden pointer-events-auto"
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ backdropFilter: 'none' }}
        />
      )}

      {/* Sidebar - Fixed position, independent scroll */}
      <div className={`
        admin-sidebar-fixed bg-white shadow-2xl transform transition-transform duration-300 ease-in-out z-[50]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="admin-sidebar-scroll flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <Link to="/admin" className="flex items-center space-x-2.5">
                <img 
                  src="/logo.png" 
                  alt="Vintage Beauty Logo" 
                  className="w-9 h-9 object-contain"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-base shadow hidden">
                  V
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                  Vintage Admin
                </h2>
              </Link>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-500">Manage your store</p>
          </div>

          {/* Navigation - scrollable area with proper spacing */}
          <nav className="admin-sidebar-nav px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`
                  flex items-center px-4 py-3 rounded-xl text-gray-600 transition-all duration-200 group
                  ${isActive(item.path) 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg' 
                    : 'hover:bg-gray-100 hover:text-blue-600 hover:shadow-md'
                  }
                `}
              >
                <div className={`
                  ${isActive(item.path) ? 'text-white' : 'text-gray-500 group-hover:text-blue-600'}
                `}>
                  {item.icon}
                </div>
                <span className="ml-3 font-medium">{item.label}</span>
                {isActive(item.path) && (
                  <div className="ml-auto w-2 h-2 bg-white rounded-full"></div>
                )}
              </Link>
            ))}
          </nav>

          {/* Logout Button - Fixed at bottom */}
          <div className="p-4 border-t border-gray-100 flex-shrink-0 mt-auto">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-200 group"
            >
              <LogOut size={20} className="text-gray-500 group-hover:text-red-600" />
              <span className="ml-3 font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Independent scroll, shifted by sidebar on desktop */}
      <div className="admin-main-content bg-gradient-to-br from-gray-50 to-gray-100" style={{ zIndex: 1 }}>
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3 flex-shrink-0">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Menu size={20} className="text-gray-600" />
            </button>
            <Link to="/admin" className="flex items-center space-x-2">
              <img 
                src="/logo.png" 
                alt="Vintage Beauty Logo" 
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow hidden">
                V
              </div>
              <span className="text-base font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
                Vintage Admin
              </span>
            </Link>
          </div>
        </div>

        {/* Content Area - This is the scrollable region for page content */}
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </div>
    </>
  );
};

export default SidebarLayout;

