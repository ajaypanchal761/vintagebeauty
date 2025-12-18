import React, { useState, useEffect } from 'react';
import { 
  Heart, 
  User, 
  ShoppingBag,
  BarChart3,
  TrendingUp
} from 'lucide-react';
import adminService from '../admin-services/adminService';

const WishlistManagement = () => {
  const [wishlists, setWishlists] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Check if admin is logged in before making API calls
      const adminToken = localStorage.getItem('adminToken');
      if (!adminToken) {
        console.error('No admin token found');
        return;
      }

      const [wishlistsData, analyticsData] = await Promise.all([
        adminService.getAllWishlists(),
        adminService.getWishlistAnalytics()
      ]);
      
      if (wishlistsData && wishlistsData.data) {
        setWishlists(wishlistsData.data || []);
      }
      
      if (analyticsData && analyticsData.data) {
        setAnalytics(analyticsData.data || {});
      }
    } catch (error) {
      console.error('Error fetching wishlist data:', error);
      // Don't redirect here - let the component handle the error gracefully
      // Set empty data to prevent crashes
      setWishlists([]);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-4 border-pink-100 border-l-pink-600 rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate most wishlisted products (use analytics if available, otherwise calculate from wishlists)
  const mostWishlisted = analytics?.mostWishlisted || [];
  if (mostWishlisted.length === 0) {
    wishlists.forEach(wishlist => {
      wishlist.products?.forEach(product => {
        const productId = product._id?.toString() || product.toString();
        const existing = mostWishlisted.find(p => {
          const pId = p.product?._id?.toString() || p.product?.toString() || p.productId;
          return pId === productId;
        });
        if (existing) {
          existing.count++;
        } else {
          mostWishlisted.push({ product, count: 1 });
        }
      });
    });
    mostWishlisted.sort((a, b) => b.count - a.count);
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Heart className="h-8 w-8 text-pink-600" />
          Wishlist Management
        </h1>
        <p className="text-gray-600 mt-2">Monitor and analyze user wishlists</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Wishlists</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.totalWishlists ?? wishlists.length ?? 0}
              </p>
            </div>
            <div className="p-3 bg-pink-100 rounded-xl">
              <Heart className="h-8 w-8 text-pink-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.totalProducts ?? wishlists.reduce((sum, w) => sum + (w.products?.length || 0), 0)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-xl">
              <ShoppingBag className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Wishlists</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.activeWishlists ?? wishlists.filter(w => w.products && w.products.length > 0).length}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-xl">
              <User className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg per User</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.avgPerUser ?? (wishlists.length > 0 
                  ? Math.round(wishlists.reduce((sum, w) => sum + (w.products?.length || 0), 0) / wishlists.length)
                  : 0)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-xl">
              <BarChart3 className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'overview'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('popular')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'popular'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Most Wishlisted
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'users'
                ? 'border-pink-600 text-pink-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            User Wishlists
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Summary */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Total Wishlists</span>
                <span className="font-semibold text-gray-900">{wishlists.length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Active Wishlists</span>
                <span className="font-semibold text-green-600">{wishlists.filter(w => w.products && w.products.length > 0).length}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-gray-600">Empty Wishlists</span>
                <span className="font-semibold text-gray-400">{wishlists.filter(w => !w.products || w.products.length === 0).length}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-gray-600">Total Products in Wishlists</span>
                <span className="font-semibold text-blue-600">{wishlists.reduce((sum, w) => sum + (w.products?.length || 0), 0)}</span>
              </div>
            </div>
          </div>

          {/* Insights */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-6 border border-pink-100">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">Insights</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-pink-600">
                    {analytics?.activePercentage ?? (wishlists.length > 0 
                      ? ((wishlists.filter(w => w.products && w.products.length > 0).length / wishlists.length) * 100).toFixed(1)
                      : 0)}%
                  </span> of users have active wishlists
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  Average <span className="font-semibold text-blue-600">
                    {analytics?.avgPerUser ?? (wishlists.length > 0 
                      ? Math.round(wishlists.reduce((sum, w) => sum + (w.products?.length || 0), 0) / wishlists.length)
                      : 0)}
                  </span> products per wishlist
                </p>
              </div>
              <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold text-purple-600">
                    {mostWishlisted.length}
                  </span> products in top wishlisted
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'popular' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">Most Wishlisted Products</h3>
            <p className="text-sm text-gray-600 mt-1">Top products users love</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wishlisted</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {mostWishlisted.slice(0, 10).map((item, index) => {
                  const product = item.product || {};
                  const productId = product._id || item.productId;
                  return (
                    <tr key={productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className={`text-lg font-bold ${
                            index === 0 ? 'text-yellow-500' : 
                            index === 1 ? 'text-gray-400' : 
                            index === 2 ? 'text-orange-600' : 
                            'text-gray-600'
                          }`}>
                            #{index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{product.name || 'Unknown Product'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">₹{product.price || product.sizes?.[0]?.price || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-pink-500" />
                          <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                          <span className="text-xs text-gray-500">times</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {mostWishlisted.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No wishlisted products found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">User Wishlists</h3>
            <p className="text-sm text-gray-600 mt-1">All user wishlists</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {wishlists.map((wishlist) => (
                  <tr key={wishlist._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 bg-pink-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-pink-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {wishlist.userName || wishlist.user?.name || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{wishlist.email || wishlist.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-pink-100 text-pink-800">
                        {wishlist.products?.length || 0} items
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {wishlist.updatedAt 
                        ? new Date(wishlist.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        : wishlist.createdAt 
                          ? new Date(wishlist.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'N/A'}
                    </td>
                  </tr>
                ))}
                {wishlists.length === 0 && (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                      No wishlists found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistManagement;
