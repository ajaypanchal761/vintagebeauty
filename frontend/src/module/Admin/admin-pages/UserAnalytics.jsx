import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  AlertTriangle,
  Calendar,
  BarChart3,
  Activity,
  Eye,
  ShoppingCart,
  Tag,
  RefreshCw
} from 'lucide-react';
import userAnalyticsService from '../../../services/userAnalyticsService';

const UserAnalytics = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showUserDetailsModal, setShowUserDetailsModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('all');
  const [userDetails, setUserDetails] = useState({ registered: [], anonymous: [] });
  
  const [userAnalytics, setUserAnalytics] = useState({
    userStats: {
      totalUsers: 0,
      registeredUsers: 0,
      registeredButNotLoggedIn: 0,
      activeRegisteredUsers: 0,
      activeAnonymousUsers: 0
    },
    activityStats: {
      totalActivities: 0,
      activityCounts: {},
      registeredUserActivities: 0,
      anonymousUserActivities: 0
    },
    popularCategories: [],
    mostViewedProducts: [],
    userEngagement: {
      registeredUserEngagement: 0,
      anonymousUserEngagement: 0,
      totalEngagement: 0
    }
  });

  useEffect(() => {
    fetchUserAnalytics();
  }, [selectedPeriod]);

  const fetchUserAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAnalyticsService.getUserAnalytics(selectedPeriod);
      if (response.data && response.data.analytics) {
        setUserAnalytics(response.data.analytics);
      }
    } catch (err) {
      console.error('Error fetching user analytics:', err);
      setError('Failed to load user analytics');
      // Set default values
      setUserAnalytics({
        userStats: {
          totalUsers: 0,
          registeredUsers: 0,
          registeredButNotLoggedIn: 0,
          activeRegisteredUsers: 0,
          activeAnonymousUsers: 0
        },
        activityStats: {
          totalActivities: 0,
          activityCounts: {},
          registeredUserActivities: 0,
          anonymousUserActivities: 0
        },
        popularCategories: [],
        mostViewedProducts: [],
        userEngagement: {
          registeredUserEngagement: 0,
          anonymousUserEngagement: 0,
          totalEngagement: 0
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userType = 'all') => {
    try {
      const response = await userAnalyticsService.getUserDetails(userType, selectedPeriod);
      if (response.data && response.data.users) {
        setUserDetails(response.data.users);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchUserAnalytics();
    } catch (err) {
      console.error('Error refreshing analytics:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Users className="text-blue-600" size={32} />
            User Analytics
          </h1>
          <p className="text-gray-600 mt-2">Comprehensive user behavior and engagement insights</p>
        </div>
        
        {/* Period Selector and Refresh */}
        <div className="flex gap-2 mt-4 sm:mt-0">
          {['daily', 'monthly', 'yearly'].map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedPeriod === period
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* User Engagement Overview */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 mb-6"
      >
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-purple-600" size={24} />
          <h2 className="text-2xl font-bold text-gray-800">User Overview ({selectedPeriod})</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white hover:from-blue-600 hover:to-blue-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('all');
              setShowUserDetailsModal(true);
              fetchUserDetails('all');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.totalUsers}</p>
              </div>
              <Users size={32} className="text-blue-200" />
            </div>
          </div>

          <div 
            className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Registered Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.registeredUsers}</p>
              </div>
              <Users size={32} className="text-green-200" />
            </div>
          </div>

          <div 
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-lg p-4 text-white hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm">Active Registered</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.activeRegisteredUsers}</p>
              </div>
              <Users size={32} className="text-yellow-200" />
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white hover:from-orange-600 hover:to-orange-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('anonymous');
              setShowUserDetailsModal(true);
              fetchUserDetails('anonymous');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Anonymous Users</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.activeAnonymousUsers}</p>
              </div>
              <Users size={32} className="text-orange-200" />
            </div>
          </div>
          
          <div 
            className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-4 text-white hover:from-red-600 hover:to-red-700 transition-all duration-200 cursor-pointer"
            onClick={() => {
              setSelectedUserType('registered');
              setShowUserDetailsModal(true);
              fetchUserDetails('registered');
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm">Not Logged In</p>
                <p className="text-2xl font-bold">{userAnalytics.userStats.registeredButNotLoggedIn}</p>
              </div>
              <AlertTriangle size={32} className="text-red-200" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Activity Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-blue-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Activity Breakdown</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-blue-600" size={20} />
                <span className="text-gray-700">Total Activities</span>
              </div>
              <span className="font-bold text-blue-600 text-xl">{userAnalytics.activityStats.totalActivities}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <ShoppingCart className="text-green-600" size={20} />
                <span className="text-gray-700">Add to Cart</span>
              </div>
              <span className="font-bold text-green-600 text-xl">{userAnalytics.activityStats.activityCounts.add_to_cart || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Tag className="text-purple-600" size={20} />
                <span className="text-gray-700">Category Visits</span>
              </div>
              <span className="font-bold text-purple-600 text-xl">{userAnalytics.activityStats.activityCounts.category_visit || 0}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Eye className="text-orange-600" size={20} />
                <span className="text-gray-700">Product Views</span>
              </div>
              <span className="font-bold text-orange-600 text-xl">{userAnalytics.activityStats.activityCounts.product_view || 0}</span>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">User Engagement</h3>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" size={20} />
                <span className="text-gray-700">Registered Engagement</span>
              </div>
              <span className="font-bold text-blue-600 text-xl">{userAnalytics.userEngagement.registeredUserEngagement}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Users className="text-gray-600" size={20} />
                <span className="text-gray-700">Anonymous Engagement</span>
              </div>
              <span className="font-bold text-gray-600 text-xl">{userAnalytics.userEngagement.anonymousUserEngagement}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-2">
                <Activity className="text-green-600" size={20} />
                <span className="text-gray-700">Total Engagement</span>
              </div>
              <span className="font-bold text-green-600 text-xl">{userAnalytics.userEngagement.totalEngagement}</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Popular Categories and Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Tag className="text-purple-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Most Popular Categories</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userAnalytics.popularCategories && userAnalytics.popularCategories.length > 0 ? (
              userAnalytics.popularCategories.map((category, index) => (
                <div key={category.categoryId || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                      <span className="text-purple-600 font-bold text-sm">{index + 1}</span>
                    </div>
                    <span className="text-gray-700 font-medium">{category.categoryName || category.name}</span>
                  </div>
                  <span className="font-bold text-blue-600">{category.visitCount || 0} visits</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Tag className="mx-auto mb-2 opacity-50" size={32} />
                <p>No category data available</p>
              </div>
            )}
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Eye className="text-green-600" size={24} />
            <h3 className="text-lg font-semibold text-gray-800">Most Viewed Products</h3>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {userAnalytics.mostViewedProducts && userAnalytics.mostViewedProducts.length > 0 ? (
              userAnalytics.mostViewedProducts.map((product, index) => (
                <div key={product.productId || index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-700 font-medium truncate">{product.productName || product.name}</p>
                        {product.category && (
                          <p className="text-xs text-gray-500 truncate">Category: {product.category}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className="font-bold text-green-600 ml-2">{product.viewCount || 0} views</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Eye className="mx-auto mb-2 opacity-50" size={32} />
                <p>No product view data available</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* User Details Modal */}
      {showUserDetailsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                User Details - {selectedUserType === 'all' ? 'All Users' : 
                               selectedUserType === 'registered' ? 'Registered Users' : 
                               'Anonymous Users'}
              </h2>
              <button
                onClick={() => setShowUserDetailsModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Registered Users */}
              {(selectedUserType === 'all' || selectedUserType === 'registered') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Registered Users</h3>
                  {userDetails.registered && userDetails.registered.length > 0 ? (
                    <div className="space-y-4">
                      {userDetails.registered.map((userGroup, index) => (
                        <div key={userGroup.user?._id || index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-gray-800">{userGroup.user?.name || 'Unknown User'}</h4>
                                {userGroup.user?.googleId && (
                                  <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                    Google Login
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{userGroup.user?.email || 'No email'}</p>
                              {userGroup.user?.createdAt && (
                                <p className="text-xs text-gray-500">
                                  Registered: {new Date(userGroup.user.createdAt).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-blue-600">{userGroup.totalActivities || 0} activities</p>
                              {userGroup.lastActivity && (
                                <p className="text-xs text-gray-500">
                                  Last activity: {new Date(userGroup.lastActivity).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {userGroup.activities && userGroup.activities.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-700">Recent Activities:</h5>
                              {userGroup.activities.slice(0, 5).map((activity, actIndex) => (
                                <div key={actIndex} className="text-xs text-gray-600 bg-white p-2 rounded">
                                  <span className="font-medium">{activity.type}</span>
                                  {activity.productName && <span> - {activity.productName}</span>}
                                  {activity.searchQuery && <span> - "{activity.searchQuery}"</span>}
                                  {activity.category && activity.category.name && <span> - {activity.category.name}</span>}
                                  {activity.timestamp && (
                                    <span className="text-gray-400 ml-2">
                                      {new Date(activity.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No registered users found</p>
                  )}
                </div>
              )}

              {/* Anonymous Users */}
              {(selectedUserType === 'all' || selectedUserType === 'anonymous') && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Anonymous Users</h3>
                  {userDetails.anonymous && userDetails.anonymous.length > 0 ? (
                    <div className="space-y-4">
                      {userDetails.anonymous.map((session, index) => (
                        <div key={session.sessionId || index} className="bg-gray-50 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-800">Anonymous Session</h4>
                              <p className="text-sm text-gray-600">Session ID: {session.sessionId || 'N/A'}</p>
                              {session.sessionStart && (
                                <p className="text-xs text-gray-500">
                                  Started: {new Date(session.sessionStart).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-orange-600">{session.totalActivities || 0} activities</p>
                              {session.lastActivity && (
                                <p className="text-xs text-gray-500">
                                  Last activity: {new Date(session.lastActivity).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                          {session.activities && session.activities.length > 0 && (
                            <div className="space-y-2">
                              <h5 className="text-sm font-medium text-gray-700">Recent Activities:</h5>
                              {session.activities.slice(0, 5).map((activity, actIndex) => (
                                <div key={actIndex} className="text-xs text-gray-600 bg-white p-2 rounded">
                                  <span className="font-medium">{activity.type}</span>
                                  {activity.productName && <span> - {activity.productName}</span>}
                                  {activity.searchQuery && <span> - "{activity.searchQuery}"</span>}
                                  {activity.category && activity.category.name && <span> - {activity.category.name}</span>}
                                  {activity.timestamp && (
                                    <span className="text-gray-400 ml-2">
                                      {new Date(activity.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No anonymous users found</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAnalytics;

