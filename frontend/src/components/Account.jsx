import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import userService from '../services/userService';
import toast from 'react-hot-toast';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';

const Account = () => {
  const navigate = useNavigate();
  const { logout, user: authUser, login, isAuthenticated, token } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const [user, setUser] = useState(authUser); // Initialize with auth store user
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileFormData, setProfileFormData] = useState({
    name: authUser?.name || '',
    email: authUser?.email || ''
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Fetch user data on component mount
  useEffect(() => {
    // UserProtectedRoute already handles authentication check
    // If we reach here, user is authenticated (or token exists)
    // Use auth store data if available, otherwise fetch from API

    // Ensure we have a token before making API calls
    const currentToken = token || localStorage.getItem('token');
    if (!currentToken) {
      console.error('No token found in Account component');
      // Don't call logout here - let UserProtectedRoute handle it
      // Just navigate to login
      navigate('/login');
      return;
    }

    // If we have user data in store, use it initially but still fetch fresh data
    if (authUser) {
      setUser(authUser);
      setProfileFormData({
        name: authUser.name || '',
        email: authUser.email || ''
      });
      setLoading(false);
    }

    // Fetch user profile - API will handle authentication errors
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 2;
    
    const fetchData = async (isRetry = false) => {
      // Wait for Zustand to fully hydrate and token to be available
      // Increased delay to ensure everything is ready
      if (!isRetry) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      // Verify token still exists before making request
      const verifyToken = localStorage.getItem('token');
      if (!verifyToken) {
        console.error('Token missing before API call - might have been cleared');
        if (isMounted) {
          setLoading(false);
        }
        return;
      }
      
      try {
        if (!authUser && !isRetry) {
          setLoading(true);
        }
        
        // Log token status for debugging
        if (import.meta.env.DEV) {
          console.log('Fetching user data with token:', {
            hasToken: !!verifyToken,
            tokenLength: verifyToken.length,
            tokenPrefix: verifyToken.substring(0, 20) + '...'
          });
        }
        
        const response = await userService.getCurrentUser();
        if (isMounted && response.success) {
          const userData = response.data;
          setUser(userData);
          setProfileFormData({
            name: userData.name || '',
            email: userData.email || ''
          });
          // Update auth store with fresh user data
          const updatedToken = token || localStorage.getItem('token');
          if (updatedToken) {
            login(userData, updatedToken);
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error('Failed to fetch user profile:', error);
          
          // Handle 401 errors - token is invalid/expired
          if (error.response?.status === 401) {
            // Check if this is a recent login (within grace period)
            const loginTimestamp = localStorage.getItem('loginTimestamp');
            const timeSinceLogin = loginTimestamp ? Date.now() - parseInt(loginTimestamp) : Infinity;
            const isRecentLogin = timeSinceLogin < 10000; // 10 second grace period
            
            // Check if token still exists
            const tokenStillExists = localStorage.getItem('token');
            
            if (isRecentLogin && tokenStillExists && retryCount < maxRetries) {
              // Recent login, might be timing issue - retry with exponential backoff
              retryCount++;
              const retryDelay = 1000 * retryCount; // 1s, 2s
              console.warn(`401 on /users/me after recent login, retrying (${retryCount}/${maxRetries}) in ${retryDelay}ms...`);
              
              setTimeout(async () => {
                if (isMounted && localStorage.getItem('token')) {
                  // Verify token still exists before retry
                  await fetchData(true);
                } else {
                  if (isMounted) {
                    setLoading(false);
                  }
                }
              }, retryDelay);
              return; // Don't set loading to false yet, we're retrying
            } else if (!tokenStillExists) {
              // Token was cleared - API interceptor or something else cleared it
              console.error('Token was cleared during error handling');
              // Don't do anything - UserProtectedRoute will handle redirect
            } else {
              // Not recent login or max retries reached
              // Check if token is actually invalid by verifying it exists and format
              const currentTokenCheck = localStorage.getItem('token');
              if (currentTokenCheck && currentTokenCheck.trim().length > 0) {
                // Token exists but got 401 - might be expired or invalid
                // Log detailed error for debugging
                console.error('401 Unauthorized - Token exists but invalid:', {
                  tokenLength: currentTokenCheck.length,
                  errorMessage: error.response?.data?.message,
                  errorStatus: error.response?.status
                });
                // Don't call logout here - let API interceptor handle it if needed
                // Just show error to user
                toast.error('Session expired. Please login again.');
                // API interceptor will handle logout and redirect
              } else {
                // No token - UserProtectedRoute will handle
                console.warn('No token found after 401 error');
              }
            }
          } else {
            // For other errors, show the actual error message
            const errorMessage = error.message || error.response?.data?.message || 'Failed to load profile';
            
            // Log error details for debugging
            if (import.meta.env.DEV) {
              console.error('Account component error:', {
                message: errorMessage,
                error: error,
                response: error.response?.data
              });
            }
            
            // Show toast with actual error message
            toast.error(errorMessage);
          }
        }
      } finally {
        if (isMounted && retryCount >= maxRetries) {
          setLoading(false);
        } else if (isMounted && !isRetry) {
          // Only set loading false if not retrying
          setLoading(false);
        }
      }
    };

    fetchData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount - UserProtectedRoute handles auth changes

  const handleEditProfile = () => {
    setIsEditingProfile(true);
    setProfileFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    setProfileFormData({
      name: user?.name || '',
      email: user?.email || ''
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!user?._id) return;

    setIsSavingProfile(true);
    try {
      const response = await userService.updateProfile(user._id, {
        name: profileFormData.name.trim(),
        email: profileFormData.email.trim()
      });
      
      if (response.success) {
        setUser(response.data);
        // Update auth store with new user data
        const token = localStorage.getItem('token');
        if (token) {
          login(response.data, token);
        }
        setIsEditingProfile(false);
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Update profile error:', error);
      
      // Show actual error message
      const errorMessage = error.message || error.response?.data?.message || 'Failed to update profile';
      
      // Log error details for debugging
      if (import.meta.env.DEV) {
        console.error('Update profile error details:', {
          message: errorMessage,
          error: error,
          response: error.response?.data
        });
      }
      
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'JD';
    const names = name.trim().split(' ');
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const accountOptions = [
    {
      id: 'orders',
      title: 'My Orders',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      onClick: () => navigate('/orders'),
    },
    {
      id: 'wishlist',
      title: 'Wishlist',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      onClick: () => navigate('/wishlist'),
    },
    {
      id: 'addresses',
      title: 'My Addresses',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      onClick: () => navigate('/addresses'),
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      onClick: () => navigate('/notifications'),
    },
    {
      id: 'help',
      title: 'Help & Support',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      onClick: () => navigate('/support'),
    },
    {
      id: 'faqs',
      title: 'FAQs',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => navigate('/faqs'),
    },
    {
      id: 'terms',
      title: 'Terms & Conditions',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => navigate('/terms-and-conditions'),
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      onClick: () => navigate('/privacy-policy'),
    },
    {
      id: 'about',
      title: 'About Us',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      onClick: () => navigate('/about-us'),
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: (
        <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      onClick: () => {
        logout();
        navigate('/login');
      },
      isDestructive: true,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Header */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img 
                  src={logo} 
                  alt="Vintage Beauty Logo" 
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                Account
              </h1>
            </div>

            <div className="w-10"></div> {/* Spacer for centering */}
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Profile Section */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl md:rounded-3xl p-4 md:p-6 mb-4 md:mb-6 border border-gray-800 shadow-xl">
              {!isEditingProfile ? (
                <div className="flex items-center gap-3 md:gap-4">
                  {/* Profile Avatar */}
                  <div className="relative">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center border-2 border-[#D4AF37] shadow-lg">
                      <span className="text-2xl md:text-3xl font-bold text-black">
                        {getInitials(user?.name)}
                      </span>
                    </div>
                    <button 
                      onClick={handleEditProfile}
                      className="absolute bottom-0 right-0 bg-[#D4AF37] text-black rounded-full p-1.5 md:p-2 shadow-lg hover:bg-amber-500 transition-colors"
                      title="Edit avatar"
                    >
                      <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                  </div>

                  {/* User Info */}
                  <div className="flex-1">
                    <h2 className="text-lg md:text-2xl font-bold text-white mb-1">
                      {user?.name || 'User'}
                    </h2>
                    <p className="text-sm md:text-base text-gray-400 mb-2">
                      {user?.email || 'No email provided'}
                    </p>
                    <button 
                      onClick={handleEditProfile}
                      className="text-xs md:text-sm text-[#D4AF37] hover:text-amber-400 font-medium transition-colors"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="flex items-center gap-3 md:gap-4 mb-4">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-[#D4AF37] to-amber-600 flex items-center justify-center border-2 border-[#D4AF37] shadow-lg">
                      <span className="text-2xl md:text-3xl font-bold text-black">
                        {getInitials(profileFormData.name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-lg md:text-2xl font-bold text-white mb-2">Edit Profile</h2>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-gray-400 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={profileFormData.name}
                      onChange={(e) => setProfileFormData({ ...profileFormData, name: e.target.value })}
                      required
                      placeholder="Enter your full name"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm md:text-base text-gray-400 mb-2">
                      Email Address <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={profileFormData.email}
                      onChange={(e) => setProfileFormData({ ...profileFormData, email: e.target.value })}
                      required
                      placeholder="your.email@example.com"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSavingProfile}
                      className="flex-1 bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSavingProfile ? (
                        <>
                          <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Saving...</span>
                        </>
                      ) : (
                        'Save Changes'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </>
        )}

        {/* Options List */}
        {!loading && (
          <div className="space-y-2 md:space-y-3">
          {accountOptions.map((option, index) => (
            <button
              key={option.id}
              onClick={option.onClick}
              className={`w-full flex items-center gap-3 md:gap-4 px-4 md:px-6 py-3 md:py-4 bg-gray-900 hover:bg-gray-800 rounded-xl md:rounded-2xl transition-all duration-200 border border-gray-800 hover:border-[#D4AF37]/30 group ${
                option.isDestructive ? 'hover:bg-red-900/20 hover:border-red-500/30' : ''
              }`}
            >
              <div className={`flex-shrink-0 ${option.isDestructive ? 'text-red-400' : 'text-[#D4AF37]'} group-hover:scale-110 transition-transform`}>
                {option.icon}
              </div>
              <span className={`flex-1 text-left text-sm md:text-base font-medium ${
                option.isDestructive ? 'text-red-400' : 'text-white'
              }`}>
                {option.title}
              </span>
              {option.id === 'notifications' && unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-[#D4AF37] text-black text-xs font-bold rounded-full">
                  {unreadCount}
                </span>
              )}
              <svg 
                className={`w-4 h-4 md:w-5 md:h-5 text-gray-500 group-hover:text-[#D4AF37] transition-colors ${
                  option.isDestructive ? 'group-hover:text-red-400' : ''
                }`}
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
          </div>
        )}

        {/* Footer Info */}
        {!loading && (
          <div className="mt-6 md:mt-8 text-center">
            <p className="text-xs md:text-sm text-gray-500">
              Vintage Beauty © 2025. All rights reserved.
            </p>
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNavbar />
    </div>
  );
};

export default Account;

