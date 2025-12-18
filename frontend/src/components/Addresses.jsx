import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import userService from '../services/userService';
import toast from 'react-hot-toast';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';

const Addresses = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    type: 'home',
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false
  });

  // Fetch addresses function - defined outside useEffect so it can be reused
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const addressesList = await userService.getAddresses();
      setAddresses(addressesList || []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      toast.error(error.message || 'Failed to load addresses');
      if (error.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch addresses on component mount
  useEffect(() => {
    // Check authentication first
    const token = localStorage.getItem('token');
    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Fetch addresses only once on mount
    fetchAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // SVG Icon Components
  const HomeIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const WorkIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  const LocationIcon = ({ className = "w-5 h-5" }) => (
    <svg className={className} width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const addressTypes = [
    { value: 'home', label: 'Home', Icon: HomeIcon },
    { value: 'work', label: 'Work', Icon: WorkIcon },
    { value: 'other', label: 'Other', Icon: LocationIcon }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phone') {
      // Format phone number - remove non-digits and limit to 10 digits
      const cleaned = value.replace(/\D/g, '').slice(0, 10);
      setFormData(prev => ({
        ...prev,
        [name]: cleaned
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type
    }));
  };

  const handleEdit = (address) => {
    setEditingId(address._id || address.id);
    setFormData({
      type: address.type,
      name: address.name,
      phone: address.phone,
      address: address.address,
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault || false
    });
    setIsAdding(true);
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData({
      type: 'home',
      name: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?._id) {
      toast.error('User not found. Please login again.');
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      if (editingId) {
        // Update existing address
        const response = await userService.updateAddress(user._id, editingId, formData);
        if (response.success) {
          toast.success('Address updated successfully!');
          await fetchAddresses();
          handleCancel();
        }
      } else {
        // Add new address
        const response = await userService.addAddress(user._id, formData);
        if (response.success) {
          toast.success('Address added successfully!');
          await fetchAddresses();
          handleCancel();
        }
      }
    } catch (error) {
      console.error('Save address error:', error);
      toast.error(error.message || 'Failed to save address');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (addressId) => {
    if (!window.confirm('Are you sure you want to delete this address?')) {
      return;
    }

    if (!user?._id) {
      toast.error('User not found. Please login again.');
      navigate('/login');
      return;
    }

    try {
      const response = await userService.deleteAddress(user._id, addressId);
      if (response.success) {
        toast.success('Address deleted successfully!');
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Delete address error:', error);
      toast.error(error.message || 'Failed to delete address');
    }
  };

  const handleSetDefault = async (addressId) => {
    if (!user?._id) {
      toast.error('User not found. Please login again.');
      navigate('/login');
      return;
    }

    try {
      const response = await userService.setDefaultAddress(user._id, addressId);
      if (response.success) {
        toast.success('Default address updated!');
        await fetchAddresses();
      }
    } catch (error) {
      console.error('Set default address error:', error);
      toast.error(error.message || 'Failed to set default address');
    }
  };

  const getAddressTypeLabel = (type) => {
    return addressTypes.find(t => t.value === type)?.label || 'Other';
  };

  const getAddressTypeIcon = (type) => {
    const addressType = addressTypes.find(t => t.value === type);
    if (!addressType) return <LocationIcon className="w-6 h-6" />;
    const IconComponent = addressType.Icon;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen bg-black text-white pb-20 md:pb-0">
      {/* Header */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-40">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/account')}
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
                My Addresses
              </h1>
            </div>

            <div className="w-10"></div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 md:px-6 py-4 md:py-8 max-w-4xl">
        {/* Add Address Button */}
        {!isAdding && (
          <div className="mb-6">
            <button
              onClick={() => setIsAdding(true)}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#F4D03F] hover:to-amber-400 text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Address</span>
            </button>
          </div>
        )}

        {/* Add/Edit Address Form */}
        {isAdding && (
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-5 md:p-6 border border-gray-800 shadow-xl mb-6">
            <div className="flex items-center justify-between mb-4 md:mb-6">
              <h2 className="text-lg md:text-xl font-bold text-white">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
              {/* Address Type */}
              <div>
                <label className="block text-sm md:text-base text-gray-400 mb-2">
                  Address Type
                </label>
                <div className="flex flex-wrap gap-2 md:gap-3">
                  {addressTypes.map((type) => {
                    const IconComponent = type.Icon;
                    return (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                        className={`flex-1 min-w-[100px] flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-lg border-2 transition-all duration-300 ${
                        formData.type === type.value
                          ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#D4AF37]'
                          : 'border-gray-700 hover:border-gray-600 text-gray-400'
                      }`}
                    >
                        <IconComponent className="w-5 h-5 md:w-5 md:h-5 flex-shrink-0" />
                        <span className="text-xs md:text-sm font-medium whitespace-nowrap">{type.label}</span>
                    </button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm md:text-base text-gray-400 mb-2">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your full name"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm md:text-base text-gray-400 mb-2">
                  Phone Number <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 focus-within:border-[#D4AF37] transition-colors">
                  <span className="text-gray-400">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="9876543210"
                    maxLength="10"
                    className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm md:text-base text-gray-400 mb-2">
                  Address <span className="text-red-400">*</span>
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  rows="3"
                  placeholder="House/Flat No., Building Name, Street"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors resize-none"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm md:text-base text-gray-400 mb-2">
                  City <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter city"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                />
              </div>

              {/* State and Pincode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm md:text-base text-gray-400 mb-2">
                    State <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter state"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm md:text-base text-gray-400 mb-2">
                    Pincode <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    required
                    placeholder="400001"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-3 rounded-lg transition-all duration-300 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>{editingId ? 'Updating...' : 'Saving...'}</span>
                    </>
                  ) : (
                    editingId ? 'Update Address' : 'Save Address'
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {/* Addresses List */}
            {addresses.length === 0 && !isAdding ? (
          <div className="text-center py-12 md:py-20">
            <div className="mb-6">
              <svg className="w-24 h-24 md:w-32 md:h-32 mx-auto text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 md:mb-4">No Addresses Yet</h2>
            <p className="text-gray-400 mb-6 md:mb-8">Add your first address to get started!</p>
            <button
              onClick={() => setIsAdding(true)}
              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 md:px-8 py-3 md:py-4 rounded-lg text-sm md:text-base transition-all duration-300 shadow-lg"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="space-y-4 md:space-y-6">
            {addresses.map((address) => (
              <div
                key={address._id || address.id}
                className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-6 border border-gray-800 hover:border-[#D4AF37]/30 transition-all duration-300 shadow-lg"
              >
                <div className="flex items-start justify-between mb-3 md:mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
                      {getAddressTypeIcon(address.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base md:text-lg font-bold text-white">
                          {address.name}
                        </h3>
                        {address.isDefault && (
                          <span className="px-2 py-0.5 bg-[#D4AF37]/20 text-[#D4AF37] text-xs font-semibold rounded-full border border-[#D4AF37]/30">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-gray-400">
                        {getAddressTypeLabel(address.type)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <button
                        onClick={() => handleSetDefault(address._id || address.id)}
                        className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-[#D4AF37]"
                        title="Set as default"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(address)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-[#D4AF37]"
                      title="Edit address"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(address._id || address.id)}
                      className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                      title="Delete address"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="space-y-1 text-sm md:text-base text-gray-300">
                  <p>{address.phone}</p>
                  <p>{address.address}</p>
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                </div>
              </div>
            ))}
          </div>
        )}
          </>
        )}
      </div>

      <BottomNavbar />
    </div>
  );
};

export default Addresses;

