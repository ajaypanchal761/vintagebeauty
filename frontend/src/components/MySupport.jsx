import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import supportService from '../services/supportService';
import toast from 'react-hot-toast';
import logo from '../assets/logo vintage.png';
import UserProtectedRoute from './UserProtectedRoute';

const MySupport = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [supportItems, setSupportItems] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMySupport();
    }
  }, [isAuthenticated]);

  const fetchMySupport = async () => {
    try {
      setLoading(true);
      const response = await supportService.getMySupport();
      
      if (response.success) {
        setSupportItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Error fetching support items:', error);
      toast.error(error.message || 'Failed to fetch support history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-white';
      case 'low':
        return 'bg-green-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const viewDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  return (
    <UserProtectedRoute>
      <div className="min-h-screen bg-black text-white overflow-x-hidden pb-20 md:pb-0">
        {/* Navigation Bar */}
        <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-50">
          <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
            <div className="flex items-center justify-between">
              {/* Back Button */}
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                aria-label="Back"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo/Brand Name */}
              <div className="flex items-center gap-2 md:gap-3">
                {logo && (
                  <img 
                    src={logo} 
                    alt="VINTAGE BEAUTY Logo" 
                    className="h-6 md:h-8 w-auto"
                  />
                )}
                <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                  My Support
                </h1>
              </div>

              {/* New Support Button */}
              <button
                onClick={() => navigate('/support')}
                className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
                aria-label="New Support"
                title="New Support Request"
              >
                <svg className="w-6 h-6 md:w-7 md:h-7 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>
        </nav>

        {/* Page Content */}
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8 max-w-4xl">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : supportItems.length === 0 ? (
            <div className="text-center py-20">
              <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <h3 className="text-xl font-semibold text-white mb-2">No Support Requests Yet</h3>
              <p className="text-gray-400 mb-6">You haven't submitted any queries or tickets yet.</p>
              <button
                onClick={() => navigate('/support')}
                className="bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-semibold py-3 px-6 rounded-lg hover:from-amber-500 hover:to-[#D4AF37] transition-all duration-200"
              >
                Submit a Query or Ticket
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">My Support History</h2>
                <button
                  onClick={() => navigate('/support')}
                  className="bg-gradient-to-r from-[#D4AF37] to-amber-600 text-black font-semibold py-2 px-4 rounded-lg hover:from-amber-500 hover:to-[#D4AF37] transition-all duration-200 text-sm"
                >
                  + New Request
                </button>
              </div>

              <div className="space-y-4">
                {supportItems.map((item) => (
                  <div
                    key={item._id}
                    className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 hover:border-[#D4AF37]/30 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {item.type === 'query' ? item.subject : item.title}
                          </h3>
                          <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">
                          Category: <span className="text-white capitalize">{item.category}</span>
                        </p>
                        <p className="text-sm text-gray-500">
                          Created: {formatDate(item.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={() => viewDetails(item)}
                        className="ml-4 text-[#D4AF37] hover:text-amber-400 transition-colors"
                        title="View Details"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {item.type === 'query' ? item.message : item.description}
                    </p>
                    {(item.responses?.length > 0 || item.messages?.length > 0) && (
                      <div className="mt-3 pt-3 border-t border-gray-800">
                        <p className="text-sm text-[#D4AF37]">
                          {item.type === 'query' 
                            ? `${item.responses.length} response(s)`
                            : `${item.messages.length} message(s)`
                          }
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Detail Modal */}
        {showModal && selectedItem && (
          <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
            <div className="bg-gray-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
              <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-white">
                  {selectedItem.type === 'query' ? 'Query Details' : 'Ticket Details'}
                </h3>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setSelectedItem(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Header Info */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-2">
                      {selectedItem.type === 'query' ? selectedItem.subject : selectedItem.title}
                    </h4>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-3 py-1 text-sm rounded-full ${getStatusColor(selectedItem.status)}`}>
                        {selectedItem.status}
                      </span>
                      <span className={`px-3 py-1 text-sm rounded-full ${getPriorityColor(selectedItem.priority)}`}>
                        {selectedItem.priority}
                      </span>
                      <span className="px-3 py-1 text-sm rounded-full bg-gray-700 text-gray-300">
                        {selectedItem.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    <p>Created: {formatDate(selectedItem.createdAt)}</p>
                    {selectedItem.updatedAt !== selectedItem.createdAt && (
                      <p>Updated: {formatDate(selectedItem.updatedAt)}</p>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h5 className="text-sm font-medium text-gray-400 mb-2">Description</h5>
                  <p className="text-white bg-gray-800 rounded-lg p-4">
                    {selectedItem.type === 'query' ? selectedItem.message : selectedItem.description}
                  </p>
                </div>

                {/* Responses/Messages */}
                {selectedItem.type === 'query' && selectedItem.responses && selectedItem.responses.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-3">Admin Responses</h5>
                    <div className="space-y-3">
                      {selectedItem.responses.map((response, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border-l-4 border-[#D4AF37]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#D4AF37]">
                              {response.senderName || 'Admin'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(response.createdAt)}
                            </span>
                          </div>
                          <p className="text-white text-sm">{response.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedItem.type === 'ticket' && selectedItem.messages && selectedItem.messages.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium text-gray-400 mb-3">Admin Messages</h5>
                    <div className="space-y-3">
                      {selectedItem.messages.map((message, index) => (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 border-l-4 border-[#D4AF37]">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-[#D4AF37]">
                              {message.senderName || 'Admin'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatDate(message.createdAt)}
                            </span>
                          </div>
                          <p className="text-white text-sm">{message.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {((selectedItem.type === 'query' && (!selectedItem.responses || selectedItem.responses.length === 0)) ||
                  (selectedItem.type === 'ticket' && (!selectedItem.messages || selectedItem.messages.length === 0))) && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No responses yet. Our team will get back to you soon.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </UserProtectedRoute>
  );
};

export default MySupport;

