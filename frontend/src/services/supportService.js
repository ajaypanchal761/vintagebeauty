import api from './api';
import adminApi from './adminApi';

const supportService = {
  // Get all queries (Admin only)
  getQueries: async () => {
    try {
      const response = await adminApi.get('/support/queries');
      return {
        success: true,
        data: response.data.data || { queries: [], total: 0 }
      };
    } catch (error) {
      console.error('Get queries error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch queries' };
    }
  },

  // Get all tickets (Admin only)
  getTickets: async () => {
    try {
      const response = await adminApi.get('/support/tickets');
      return {
        success: true,
        data: response.data.data || { tickets: [], total: 0 }
      };
    } catch (error) {
      console.error('Get tickets error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch tickets' };
    }
  },

  // Get single support item (Admin only)
  getSupportItem: async (id) => {
    try {
      const response = await adminApi.get(`/support/${id}`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get support item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch support item' };
    }
  },

  // Get support statistics (Admin only)
  getStats: async () => {
    try {
      const response = await adminApi.get('/support/stats');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Get support stats error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch support stats' };
    }
  },

  // Add response to query (Admin only)
  addQueryResponse: async (id, responseData) => {
    try {
      const response = await adminApi.post(`/support/queries/${id}/response`, responseData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Response added successfully'
      };
    } catch (error) {
      console.error('Add query response error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to add response' };
    }
  },

  // Add message to ticket (Admin only)
  addTicketMessage: async (id, messageData) => {
    try {
      const response = await adminApi.post(`/support/tickets/${id}/message`, messageData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Message added successfully'
      };
    } catch (error) {
      console.error('Add ticket message error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to add message' };
    }
  },

  // Update support item status (Admin only)
  updateStatus: async (id, status) => {
    try {
      const response = await adminApi.patch(`/support/${id}/status`, { status });
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Status updated successfully'
      };
    } catch (error) {
      console.error('Update status error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update status' };
    }
  },

  // Update support item (Admin only)
  updateSupportItem: async (id, updateData) => {
    try {
      const response = await adminApi.put(`/support/${id}`, updateData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Support item updated successfully'
      };
    } catch (error) {
      console.error('Update support item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to update support item' };
    }
  },

  // Delete support item (Admin only)
  deleteSupportItem: async (id) => {
    try {
      const response = await adminApi.delete(`/support/${id}`);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Support item deleted successfully'
      };
    } catch (error) {
      console.error('Delete support item error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to delete support item' };
    }
  },

  // Create query (Public)
  createQuery: async (queryData) => {
    try {
      const response = await api.post('/support/queries', queryData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Query submitted successfully'
      };
    } catch (error) {
      console.error('Create query error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to submit query' };
    }
  },

  // Create ticket (Public)
  createTicket: async (ticketData) => {
    try {
      const response = await api.post('/support/tickets', ticketData);
      return {
        success: true,
        data: response.data.data,
        message: response.data.message || 'Ticket created successfully'
      };
    } catch (error) {
      console.error('Create ticket error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to create ticket' };
    }
  },

  // Get user's support items (User)
  getMySupport: async () => {
    try {
      const response = await api.get('/support/my');
      return {
        success: true,
        data: response.data.data || { items: [], total: 0 }
      };
    } catch (error) {
      console.error('Get my support error:', error);
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { success: false, message: error.message || 'Failed to fetch support history' };
    }
  }
};

export default supportService;


