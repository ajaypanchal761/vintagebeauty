import api from './api';
import adminApi from './adminApi';

const comboDealService = {
  // Public: Get all active combo deals
  getComboDeals: async () => {
    const response = await api.get('/combo-deals');
    return response.data;
  },

  // Public: Get single combo deal
  getComboDeal: async (id) => {
    const response = await api.get(`/combo-deals/${id}`);
    return response.data;
  },

  // Admin: Get all combo deals (including inactive)
  getAllComboDeals: async () => {
    const response = await adminApi.get('/combo-deals/admin/all');
    return response.data;
  },

  // Admin: Create combo deal
  createComboDeal: async (formData) => {
    const response = await adminApi.post('/combo-deals', formData);
    return response.data;
  },

  // Admin: Update combo deal
  updateComboDeal: async (id, formData) => {
    const response = await adminApi.put(`/combo-deals/${id}`, formData);
    return response.data;
  },

  // Admin: Delete combo deal
  deleteComboDeal: async (id) => {
    const response = await adminApi.delete(`/combo-deals/${id}`);
    return response.data;
  },

  // Admin: Toggle combo deal active status
  toggleComboDeal: async (id) => {
    const response = await adminApi.put(`/combo-deals/${id}/toggle`);
    return response.data;
  },

  // Admin: Update combo deal order
  updateComboDealOrder: async (deals) => {
    const response = await adminApi.put('/combo-deals/order/update', { deals });
    return response.data;
  }
};

export default comboDealService;

