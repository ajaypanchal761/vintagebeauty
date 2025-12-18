import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, Grid, List, Image as ImageIcon, Loader2, AlertCircle, MoveUp, MoveDown, Eye, EyeOff, Edit, Trash2 } from "lucide-react";
import comboDealService from '../../../services/comboDealService';

const ComboDeals = () => {
  const [deals, setDeals] = useState([]);
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toggleLoading, setToggleLoading] = useState(null);

  // Fetch all combo deals
  const fetchDeals = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await comboDealService.getAllComboDeals();
      setDeals(response.data || []);
    } catch (error) {
      console.error("Failed to fetch combo deals", error);
      setError(error.message || "Failed to load combo deals. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeals();
  }, []);

  // Delete combo deal
  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this combo deal?")) {
      try {
        setLoading(true);
        setError(null);
        await comboDealService.deleteComboDeal(id);
        await fetchDeals();
      } catch (error) {
        console.error("Failed to delete combo deal", error);
        setError(error.message || "Failed to delete combo deal. Please try again later.");
      } finally {
        setLoading(false);
      }
    }
  };

  // Toggle active status
  const handleToggleActive = async (id) => {
    try {
      setToggleLoading(id);
      setError(null);
      await comboDealService.toggleComboDeal(id);
      await fetchDeals();
    } catch (error) {
      console.error("Failed to toggle combo deal status", error);
      setError(error.message || "Failed to update combo deal status. Please try again later.");
    } finally {
      setToggleLoading(null);
    }
  };

  // Move deal up/down in order
  const handleMove = async (currentIndex, direction) => {
    const newDeals = [...deals];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex < 0 || newIndex >= deals.length) return;
    
    [newDeals[currentIndex], newDeals[newIndex]] = [newDeals[newIndex], newDeals[currentIndex]];
    
    try {
      setError(null);
      await comboDealService.updateComboDealOrder(newDeals);
      await fetchDeals();
    } catch (error) {
      console.error("Failed to update order", error);
      setError(error.message || "Failed to update order. Please try again later.");
    }
  };

  // Filter deals based on search term
  const filteredDeals = deals.filter(deal =>
    deal.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.dealHighlight?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4 md:mb-0">Combo Deals Management</h1>
        <Link
          to="/admin/combo-deals/new"
          className="flex items-center justify-center bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Deal
        </Link>
      </div>

      {/* Search and View Toggle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div className="relative flex-1 max-w-md mb-4 md:mb-0">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search combo deals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-amber-100 text-amber-600' : 'text-gray-600 hover:bg-gray-100'}`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center bg-red-100 text-red-700 p-4 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDeals.map((deal, index) => (
            <div key={deal._id} className={`bg-white rounded-lg shadow-md overflow-hidden ${!deal.isActive ? 'border-2 border-red-300' : ''}`}>
              <div className="relative aspect-square bg-gray-100">
                <img
                  src={deal.image}
                  alt={deal.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = '/placeholder.png';
                  }}
                />
                <div className="absolute top-2 left-2">
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${deal.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {deal.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="absolute top-2 right-2 flex space-x-2">
                  <button
                    onClick={() => handleToggleActive(deal._id)}
                    disabled={toggleLoading === deal._id}
                    className={`p-1 rounded-full ${
                      deal.isActive ? 'bg-green-500' : 'bg-gray-500'
                    } text-white transition-colors ${
                      toggleLoading === deal._id ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-80'
                    }`}
                  >
                    {toggleLoading === deal._id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : deal.isActive ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{deal.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{deal.dealHighlight}</p>
                <p className="text-xs text-gray-500 mb-3">{deal.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-lg font-bold text-amber-600">₹{deal.currentPrice}</span>
                    <span className="text-sm text-gray-500 line-through ml-2">₹{deal.originalPrice}</span>
                  </div>
                  <span className="text-xs text-green-600 font-semibold">{deal.discount}</span>
                </div>
                <div className="text-xs text-gray-500 mb-3">
                  <p>Required Items: {deal.requiredItems}</p>
                  <p>Free Items: {deal.freeItems}</p>
                  <p>Deal Price: ₹{deal.dealPrice}</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleMove(index, 'up')}
                      disabled={index === 0}
                      className={`p-1 rounded ${index === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    >
                      <MoveUp className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleMove(index, 'down')}
                      disabled={index === deals.length - 1}
                      className={`p-1 rounded ${index === deals.length - 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100'}`}
                    >
                      <MoveDown className="w-4 h-4 text-gray-600" />
                    </button>
                  </div>
                  <div className="flex space-x-2">
                    <Link
                      to={`/admin/combo-deals/edit/${deal._id}`}
                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(deal._id)}
                      className="p-1 text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDeals.map((deal, index) => (
                <tr key={deal._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <img src={deal.image} alt={deal.title} className="w-16 h-16 object-cover rounded" />
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{deal.title}</div>
                    <div className="text-sm text-gray-500">{deal.description}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{deal.dealHighlight}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-amber-600">₹{deal.currentPrice}</div>
                    <div className="text-xs text-gray-500 line-through">₹{deal.originalPrice}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {deal.requiredItems} required, {deal.freeItems} free
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(deal._id)}
                      disabled={toggleLoading === deal._id}
                      className={`px-2 py-1 text-xs rounded-full ${
                        deal.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {deal.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleMove(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <MoveUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleMove(index, 'down')}
                        disabled={index === deals.length - 1}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <MoveDown className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/admin/combo-deals/edit/${deal._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(deal._id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {filteredDeals.length === 0 && !loading && (
        <div className="text-center py-12">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No combo deals</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search.' : 'Get started by creating a new combo deal.'}
          </p>
        </div>
      )}
    </div>
  );
};

export default ComboDeals;

