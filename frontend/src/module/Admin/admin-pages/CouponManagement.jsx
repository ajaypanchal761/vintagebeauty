import React, { useState, useEffect } from 'react';
import couponService from '../../../services/couponService';
import { Trash2, Edit, Plus, X, Check, Tag, AlertCircle, CheckCircle } from 'lucide-react';

const CouponManagement = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    discountPercentage: '',
    maxUses: '',
    minOrderAmount: '',
    expiryDate: '',
    isActive: true
  });
  const [validationErrors, setValidationErrors] = useState({});

  useEffect(() => {
    fetchCoupons();
  }, []);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await couponService.getCoupons();
      setCoupons(response.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch coupons');
      console.error('Error fetching coupons:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    
    // Clear success/error messages
    if (error) setError(null);
    if (success) setSuccess("");
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.code.trim()) {
      errors.code = 'Coupon code is required';
    } else if (formData.code.trim().length < 3) {
      errors.code = 'Coupon code must be at least 3 characters';
    }
    
    if (!formData.discountPercentage || formData.discountPercentage === '') {
      errors.discountPercentage = 'Discount percentage is required';
    } else {
      const discount = parseFloat(formData.discountPercentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        errors.discountPercentage = 'Discount must be between 0 and 100';
      }
    }
    
    if (!formData.maxUses || formData.maxUses === '') {
      errors.maxUses = 'Maximum uses is required';
    } else {
      const uses = parseInt(formData.maxUses);
      if (isNaN(uses) || uses < 1) {
        errors.maxUses = 'Maximum uses must be at least 1';
      }
    }
    
    if (!formData.minOrderAmount || formData.minOrderAmount === '') {
      errors.minOrderAmount = 'Minimum order amount is required';
    } else {
      const amount = parseFloat(formData.minOrderAmount);
      if (isNaN(amount) || amount < 0) {
        errors.minOrderAmount = 'Minimum order amount must be 0 or greater';
      }
    }
    
    if (!formData.expiryDate) {
      errors.expiryDate = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        errors.expiryDate = 'Expiry date cannot be in the past';
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      code: '',
      discountPercentage: '',
      maxUses: '',
      minOrderAmount: '',
      expiryDate: '',
      isActive: true
    });
    setEditingCoupon(null);
    setShowForm(false);
    setValidationErrors({});
    setError(null);
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setError(null);
      setSuccess("");
      
      // Map frontend form data to backend model format
      const couponData = {
        code: formData.code.toUpperCase().trim(),
        discountType: 'percentage', // Frontend only supports percentage
        discountValue: parseFloat(formData.discountPercentage),
        minPurchase: parseFloat(formData.minOrderAmount),
        usageLimit: parseInt(formData.maxUses),
        validFrom: new Date(), // Start from today
        validUntil: new Date(formData.expiryDate),
        isActive: formData.isActive
      };
      
      if (editingCoupon) {
        await couponService.updateCoupon(editingCoupon._id, couponData);
        setSuccess('Coupon updated successfully!');
      } else {
        await couponService.createCoupon(couponData);
        setSuccess('Coupon created successfully!');
      }
      
      await fetchCoupons();
      resetForm();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to save coupon');
      console.error('Error saving coupon:', err);
    }
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    
    // Format date for input field (YYYY-MM-DD)
    const expiryDate = coupon.validUntil 
      ? new Date(coupon.validUntil).toISOString().split('T')[0]
      : coupon.endDate 
        ? new Date(coupon.endDate).toISOString().split('T')[0]
        : '';
    
    setFormData({
      code: coupon.code || '',
      discountPercentage: coupon.discountValue || coupon.discountPercentage || '',
      maxUses: coupon.usageLimit || coupon.maxUses || '',
      minOrderAmount: coupon.minPurchase || coupon.minOrderAmount || '',
      expiryDate: expiryDate,
      isActive: coupon.isActive !== undefined ? coupon.isActive : true
    });
    setShowForm(true);
    setError(null);
    setSuccess("");
    setValidationErrors({});
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    
    try {
      setError(null);
      setSuccess("");
      await couponService.deleteCoupon(id);
      setSuccess('Coupon deleted successfully!');
      await fetchCoupons();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || err.response?.data?.message || 'Failed to delete coupon');
      console.error('Error deleting coupon:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch (err) {
      return 'Invalid Date';
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl text-gray-600">Loading coupons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Tag className="text-blue-600" size={28} />
          <h1 className="text-3xl font-bold text-gray-800">Coupon Management</h1>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(!showForm);
          }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all flex items-center gap-2 shadow-lg"
        >
          {showForm ? <X size={20} /> : <Plus size={20} />}
          {showForm ? 'Cancel' : 'Add New Coupon'}
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Coupon Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Coupon Code */}
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all ${
                    validationErrors.code ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., SUMMER20"
                  required
                />
                {validationErrors.code && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.code}</p>
                )}
              </div>

              {/* Discount Percentage */}
              <div>
                <label htmlFor="discountPercentage" className="block text-sm font-semibold text-gray-700 mb-2">
                  Discount Percentage (%) *
                </label>
                <input
                  type="number"
                  id="discountPercentage"
                  name="discountPercentage"
                  value={formData.discountPercentage}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all ${
                    validationErrors.discountPercentage ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 20"
                  required
                />
                {validationErrors.discountPercentage && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.discountPercentage}</p>
                )}
              </div>

              {/* Maximum Uses */}
              <div>
                <label htmlFor="maxUses" className="block text-sm font-semibold text-gray-700 mb-2">
                  Maximum Uses *
                </label>
                <input
                  type="number"
                  id="maxUses"
                  name="maxUses"
                  value={formData.maxUses}
                  onChange={handleInputChange}
                  min="1"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all ${
                    validationErrors.maxUses ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 100"
                  required
                />
                {validationErrors.maxUses && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.maxUses}</p>
                )}
              </div>

              {/* Minimum Order Amount */}
              <div>
                <label htmlFor="minOrderAmount" className="block text-sm font-semibold text-gray-700 mb-2">
                  Minimum Order Amount (₹) *
                </label>
                <input
                  type="number"
                  id="minOrderAmount"
                  name="minOrderAmount"
                  value={formData.minOrderAmount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all ${
                    validationErrors.minOrderAmount ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 500"
                  required
                />
                {validationErrors.minOrderAmount && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.minOrderAmount}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div>
                <label htmlFor="expiryDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  id="expiryDate"
                  name="expiryDate"
                  value={formData.expiryDate}
                  onChange={handleInputChange}
                  min={new Date().toISOString().split('T')[0]}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-all ${
                    validationErrors.expiryDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {validationErrors.expiryDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.expiryDate}</p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center pt-8">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="ml-3 text-sm font-semibold text-gray-700">
                  Active Coupon
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-lg hover:from-green-700 hover:to-green-800 transition-all flex items-center gap-2 shadow-lg"
              >
                <Check size={20} />
                {editingCoupon ? 'Update' : 'Create'} Coupon
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Discount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Uses
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Min Amount
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Expiry
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No coupons found. Click "Add New Coupon" to create one.
                  </td>
                </tr>
              ) : (
                coupons.map((coupon) => {
                  const isExpired = coupon.validUntil && new Date(coupon.validUntil) < new Date();
                  const isUsedUp = coupon.usageLimit > 0 && (coupon.usedCount || 0) >= coupon.usageLimit;
                  
                  return (
                    <tr key={coupon._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-gray-900">{coupon.code}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {coupon.discountValue || 0}{coupon.discountType === 'percentage' ? '%' : '₹'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          {coupon.usedCount || 0} / {coupon.usageLimit === 0 ? '∞' : (coupon.usageLimit || '∞')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900">
                          ₹{coupon.minPurchase || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${
                          isExpired ? 'text-red-600 font-semibold' : 'text-gray-900'
                        }`}>
                          {formatDate(coupon.validUntil)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          coupon.isActive && !isExpired && !isUsedUp
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coupon.isActive && !isExpired && !isUsedUp ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="text-blue-600 hover:text-blue-900 transition-colors"
                            title="Edit coupon"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon._id)}
                            className="text-red-600 hover:text-red-900 transition-colors"
                            title="Delete coupon"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CouponManagement;
