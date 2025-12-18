import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Ticket, 
  Clock, 
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  Reply,
  User,
  Mail,
  Phone,
  Calendar,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react';
import supportService from '../../../services/supportService';

function toIST(dateString) {
  return new Date(dateString).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
}

const CustomerSupport = () => {
  const [activeTab, setActiveTab] = useState('queries');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Auto-hide success and error messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Data states
  const [queries, setQueries] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [filteredQueries, setFilteredQueries] = useState([]);
  const [filteredTickets, setFilteredTickets] = useState([]);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  // Modal states
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Response states
  const [queryResponse, setQueryResponse] = useState('');
  const [ticketResponse, setTicketResponse] = useState('');
  const [submittingQueryResponse, setSubmittingQueryResponse] = useState(false);
  const [submittingTicketResponse, setSubmittingTicketResponse] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalQueries: 0,
    openQueries: 0,
    resolvedQueries: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0
  });

  // Fetch support data
  const fetchSupportData = async () => {
    try {
      setLoading(true);
      
      const [queriesResponse, ticketsResponse] = await Promise.all([
        supportService.getQueries(),
        supportService.getTickets()
      ]);

      if (queriesResponse.success) {
        setQueries(queriesResponse.data.queries || []);
      }

      if (ticketsResponse.success) {
        setTickets(ticketsResponse.data.tickets || []);
      }
    } catch (err) {
      console.error('Error fetching support data:', err);
      setError(err.message || 'Failed to fetch support data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const calculateStats = (queriesData, ticketsData) => {
    const totalQueries = queriesData.length;
    const openQueries = queriesData.filter(q => q.status === 'open' || q.status === 'new').length;
    const resolvedQueries = queriesData.filter(q => q.status === 'resolved').length;

    const totalTickets = ticketsData.length;
    const openTickets = ticketsData.filter(t => t.status === 'open' || t.status === 'new').length;
    const resolvedTickets = ticketsData.filter(t => t.status === 'resolved').length;

    setStats({
      totalQueries,
      openQueries,
      resolvedQueries,
      totalTickets,
      openTickets,
      resolvedTickets
    });
  };

  // Apply filters
  const applyFilters = () => {
    let filteredQueriesData = [...queries];
    let filteredTicketsData = [...tickets];

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filteredQueriesData = filteredQueriesData.filter(query =>
        query.subject?.toLowerCase().includes(searchLower) ||
        query.message?.toLowerCase().includes(searchLower) ||
        query.customerName?.toLowerCase().includes(searchLower) ||
        query.customerEmail?.toLowerCase().includes(searchLower)
      );
      filteredTicketsData = filteredTicketsData.filter(ticket =>
        ticket.title?.toLowerCase().includes(searchLower) ||
        ticket.description?.toLowerCase().includes(searchLower) ||
        ticket.customerName?.toLowerCase().includes(searchLower) ||
        ticket.customerEmail?.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filteredQueriesData = filteredQueriesData.filter(query => query.status === statusFilter);
      filteredTicketsData = filteredTicketsData.filter(ticket => ticket.status === statusFilter);
    }

    // Apply category filter
    if (categoryFilter !== 'all') {
      filteredQueriesData = filteredQueriesData.filter(query => query.category === categoryFilter);
      filteredTicketsData = filteredTicketsData.filter(ticket => ticket.category === categoryFilter);
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filteredQueriesData = filteredQueriesData.filter(query => query.priority === priorityFilter);
      filteredTicketsData = filteredTicketsData.filter(ticket => ticket.priority === priorityFilter);
    }

    setFilteredQueries(filteredQueriesData);
    setFilteredTickets(filteredTicketsData);
  };

  // Handle query response
  const handleQueryResponse = async () => {
    if (!queryResponse.trim() || !selectedQuery) return;

    try {
      setSubmittingQueryResponse(true);
      
      const response = await supportService.addQueryResponse(selectedQuery._id, {
        message: queryResponse,
        senderName: 'Admin',
        senderEmail: 'admin@vintagebeauty.com'
      });
      
      if (response.success) {
        setSuccess(response.message || 'Response added successfully');
        setQueryResponse('');
        
        // Update selected query with new response
        const newResponse = response.data.response;
        setSelectedQuery(prev => ({
          ...prev,
          responses: [...(prev.responses || []), newResponse]
        }));
        
        // Update queries list
        setQueries(prev => prev.map(query => {
          if (query._id === selectedQuery._id) {
            return {
              ...query,
              responses: [...(query.responses || []), newResponse]
            };
          }
          return query;
        }));
      }
    } catch (err) {
      console.error('Error adding query response:', err);
      setError(err.message || 'Failed to add response');
    } finally {
      setSubmittingQueryResponse(false);
    }
  };

  // Handle ticket message
  const handleTicketMessage = async () => {
    if (!ticketResponse.trim() || !selectedTicket) return;

    try {
      setSubmittingTicketResponse(true);
      
      const response = await supportService.addTicketMessage(selectedTicket._id, {
        message: ticketResponse,
        senderName: 'Admin',
        senderEmail: 'admin@vintagebeauty.com'
      });
      
      if (response.success) {
        setSuccess(response.message || 'Message added successfully');
        setTicketResponse('');
        
        // Update selected ticket with new message
        const newMessage = response.data.message;
        setSelectedTicket(prev => ({
          ...prev,
          messages: [...(prev.messages || []), newMessage]
        }));
        
        // Update tickets list
        setTickets(prev => prev.map(ticket => {
          if (ticket._id === selectedTicket._id) {
            return {
              ...ticket,
              messages: [...(ticket.messages || []), newMessage]
            };
          }
          return ticket;
        }));
      }
    } catch (err) {
      console.error('Error adding ticket message:', err);
      setError(err.message || 'Failed to add message');
    } finally {
      setSubmittingTicketResponse(false);
    }
  };

  // Handle status change
  const handleQueryStatusChange = async (queryId, newStatus) => {
    try {
      const response = await supportService.updateStatus(queryId, newStatus);
      
      if (response.success) {
        setSuccess(response.message || 'Query status updated successfully');
        
        // Update local state
        setQueries(prev => prev.map(query => 
          query._id === queryId ? { ...query, status: newStatus } : query
        ));
        
        if (selectedQuery && selectedQuery._id === queryId) {
          setSelectedQuery(prev => ({ ...prev, status: newStatus }));
        }
        
        setFilteredQueries(prev => prev.map(query => 
          query._id === queryId ? { ...query, status: newStatus } : query
        ));
      }
    } catch (err) {
      console.error('Error updating query status:', err);
      setError(err.message || 'Failed to update query status');
    }
  };

  const handleTicketStatusChange = async (ticketId, newStatus) => {
    try {
      const response = await supportService.updateStatus(ticketId, newStatus);
      
      if (response.success) {
        setSuccess(response.message || 'Ticket status updated successfully');
        
        // Update local state
        setTickets(prev => prev.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
        
        if (selectedTicket && selectedTicket._id === ticketId) {
          setSelectedTicket(prev => ({ ...prev, status: newStatus }));
        }
        
        setFilteredTickets(prev => prev.map(ticket => 
          ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
        ));
      }
    } catch (err) {
      console.error('Error updating ticket status:', err);
      setError(err.message || 'Failed to update ticket status');
    }
  };

  // View query details
  const viewQueryDetails = (query) => {
    setSelectedQuery(query);
    setShowQueryModal(true);
  };

  // View ticket details
  const viewTicketDetails = (ticket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  // Effects
  useEffect(() => {
    fetchSupportData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [queries, tickets, searchTerm, statusFilter, categoryFilter, priorityFilter]);

  // Recalculate stats whenever queries or tickets change
  useEffect(() => {
    calculateStats(queries, tickets);
  }, [queries, tickets]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading support data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Support</h1>
          <p className="text-gray-600">Manage customer queries, tickets, and support</p>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Queries</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalQueries}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved Queries</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedQueries}</p>
          </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Ticket className="h-6 w-6 text-orange-600" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTickets}</p>
          </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-purple-600" />
            </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Resolved Tickets</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolvedTickets}</p>
          </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('queries')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'queries'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <MessageSquare className="h-5 w-5 inline mr-2" />
                Support Queries ({filteredQueries.length})
              </button>
              <button
                onClick={() => setActiveTab('tickets')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tickets'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Ticket className="h-5 w-5 inline mr-2" />
                Support Tickets ({filteredTickets.length})
              </button>
          </nav>
        </div>

          {/* Filters */}
        <div className="p-6 border-b border-gray-200">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                    placeholder="Search queries and tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="billing">Billing</option>
                <option value="order">Order</option>
                <option value="product">Product</option>
                <option value="other">Other</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>

              <button
                onClick={fetchSupportData}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <RefreshCw className="h-4 w-4 inline mr-2" />
                Refresh
              </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'queries' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Support Queries ({filteredQueries.length})
                </h3>
                {filteredQueries.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No queries found</p>
                </div>
              ) : (
                  <div className="space-y-4">
                    {filteredQueries.map((query) => (
                  <div key={query._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{query.subject || query.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                query.status === 'new' || query.status === 'open' ? 'bg-red-100 text-red-800' :
                                query.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                query.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                query.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                            {query.status}
                          </span>
                              {query.priority && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  query.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                                  query.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  query.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                            {query.priority}
                          </span>
                              )}
                        </div>
                            <p className="text-gray-600 text-sm mb-2">{query.message || query.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {query.customerName || query.userName || 'Unknown User'}
                          </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {query.customerEmail || query.email || 'No email'}
                          </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                            {toIST(query.createdAt)}
                          </div>
                        </div>
                        </div>
                          <div className="flex space-x-2">
                        <button
                              onClick={() => viewQueryDetails(query)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4 inline mr-1" />
                          View
                        </button>
                            <select
                              value={query.status}
                              onChange={(e) => handleQueryStatusChange(query._id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                      </div>
                    </div>
                  </div>
                    ))}
                  </div>
              )}
            </div>
          )}

          {activeTab === 'tickets' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Support Tickets ({filteredTickets.length})
                </h3>
                {filteredTickets.length === 0 ? (
                <div className="text-center py-8">
                  <Ticket className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No tickets found</p>
                </div>
              ) : (
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                  <div key={ticket._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h4 className="font-semibold text-gray-900">{ticket.title}</h4>
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                ticket.status === 'new' || ticket.status === 'open' ? 'bg-red-100 text-red-800' :
                                ticket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                                ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                            {ticket.status}
                          </span>
                              {ticket.priority && (
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  ticket.priority === 'low' ? 'bg-blue-100 text-blue-800' :
                                  ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                  ticket.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                            {ticket.priority}
                          </span>
                              )}
                        </div>
                            <p className="text-gray-600 text-sm mb-2">{ticket.description}</p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {ticket.customerName || ticket.userName || 'Unknown User'}
                          </div>
                              <div className="flex items-center">
                                <Mail className="h-4 w-4 mr-1" />
                                {ticket.customerEmail || ticket.email || 'No email'}
                          </div>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-1" />
                            {toIST(ticket.createdAt)}
                          </div>
                        </div>
                        </div>
                          <div className="flex space-x-2">
                        <button
                              onClick={() => viewTicketDetails(ticket)}
                              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                            >
                              <Eye className="h-4 w-4 inline mr-1" />
                          View
                        </button>
                            <select
                              value={ticket.status}
                              onChange={(e) => handleTicketStatusChange(ticket._id, e.target.value)}
                              className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="new">New</option>
                              <option value="open">Open</option>
                              <option value="in_progress">In Progress</option>
                              <option value="resolved">Resolved</option>
                              <option value="closed">Closed</option>
                            </select>
                      </div>
                    </div>
                  </div>
                    ))}
            </div>
          )}
                </div>
          )}
        </div>
      </div>

        {/* Query Details Modal */}
      {showQueryModal && selectedQuery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Query Details</h3>
                  <button
                    onClick={() => setShowQueryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedQuery.subject || selectedQuery.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedQuery.status === 'new' || selectedQuery.status === 'open' ? 'bg-red-100 text-red-800' :
                        selectedQuery.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        selectedQuery.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        selectedQuery.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedQuery.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{selectedQuery.message || selectedQuery.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {selectedQuery.customerName || selectedQuery.userName || 'Unknown User'}
                  </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedQuery.customerEmail || selectedQuery.email || 'No email'}
                    </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {toIST(selectedQuery.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Responses */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Responses</h5>
                    {selectedQuery.responses && selectedQuery.responses.length > 0 ? (
                      <div className="space-y-4">
                      {selectedQuery.responses.map((response, index) => (
                          <div key={index} className={`p-4 rounded-lg ${
                            response.isAdmin ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                response.isAdmin ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                                {response.isAdmin ? 'Admin' : 'User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {toIST(response.createdAt)}
                              </span>
                          </div>
                            <p className="text-gray-700">{response.message}</p>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <p className="text-gray-500">No responses yet</p>
                    )}
                  </div>

                  {/* Add Response */}
                  <div className="border-t border-gray-200 pt-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Add Response</h5>
                    <div className="space-y-4">
                    <textarea
                      value={queryResponse}
                      onChange={(e) => setQueryResponse(e.target.value)}
                        placeholder="Type your response here..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                      <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowQueryModal(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                          Close
                    </button>
                    <button
                      onClick={handleQueryResponse}
                          disabled={!queryResponse.trim() || submittingQueryResponse}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                          {submittingQueryResponse ? 'Sending...' : 'Send Response'}
                    </button>
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ticket Details Modal */}
      {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Ticket Details</h3>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="h-6 w-6" />
                  </button>
                  </div>
                </div>

                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <div className="mb-6">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="text-xl font-semibold text-gray-900">{selectedTicket.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        selectedTicket.status === 'new' || selectedTicket.status === 'open' ? 'bg-red-100 text-red-800' :
                        selectedTicket.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                        selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        selectedTicket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">{selectedTicket.description}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        {selectedTicket.customerName || selectedTicket.userName || 'Unknown User'}
                  </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-1" />
                        {selectedTicket.customerEmail || selectedTicket.email || 'No email'}
                    </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {toIST(selectedTicket.createdAt)}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="mb-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Messages</h5>
                    {selectedTicket.messages && selectedTicket.messages.length > 0 ? (
                      <div className="space-y-4">
                      {selectedTicket.messages.map((message, index) => (
                          <div key={index} className={`p-4 rounded-lg ${
                            message.isAdmin ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-gray-50 border-l-4 border-gray-300'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-sm font-medium ${
                                message.isAdmin ? 'text-blue-800' : 'text-gray-800'
                              }`}>
                                {message.isAdmin ? 'Admin' : 'User'}
                              </span>
                              <span className="text-xs text-gray-500">
                                {toIST(message.createdAt)}
                              </span>
                          </div>
                            <p className="text-gray-700">{message.message}</p>
                        </div>
                      ))}
                    </div>
                    ) : (
                      <p className="text-gray-500">No messages yet</p>
                    )}
                  </div>

                  {/* Add Message */}
                  <div className="border-t border-gray-200 pt-6">
                    <h5 className="text-lg font-semibold text-gray-900 mb-4">Add Message</h5>
                    <div className="space-y-4">
                    <textarea
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        placeholder="Type your message here..."
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                      <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowTicketModal(false)}
                          className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300"
                    >
                          Close
                    </button>
                    <button
                      onClick={handleTicketMessage}
                          disabled={!ticketResponse.trim() || submittingTicketResponse}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                          {submittingTicketResponse ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        )}
            </div>
            </div>
  );
};

export default CustomerSupport;
