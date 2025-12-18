import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, ImagePlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import comboDealService from '../../../services/comboDealService';
import adminApi from '../../../services/adminApi';

const EditComboDeal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || window.location.pathname.includes('/admin/combo-deals/new');

  const [deal, setDeal] = useState({
    title: "",
    dealHighlight: "",
    description: "",
    currentPrice: "",
    originalPrice: "",
    discount: "",
    image: "",
    requiredItems: 3,
    freeItems: 1,
    dealPrice: "",
    isActive: true,
    order: 0
  });

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      comboDealService.getComboDeal(id)
        .then((response) => {
          const dealData = response.data;
          if (dealData) {
            setDeal({
              title: dealData.title || '',
              dealHighlight: dealData.dealHighlight || '',
              description: dealData.description || '',
              currentPrice: dealData.currentPrice || '',
              originalPrice: dealData.originalPrice || '',
              discount: dealData.discount || '',
              image: dealData.image || '',
              requiredItems: dealData.requiredItems || 3,
              freeItems: dealData.freeItems || 1,
              dealPrice: dealData.dealPrice || '',
              isActive: dealData.isActive !== undefined ? dealData.isActive : true,
              order: dealData.order || 0
            });
            if (dealData.image) {
              setPreviewUrl(dealData.image);
            }
          } else {
            showToast("Combo deal not found", "error");
          }
        })
        .catch((error) => {
          console.error("Failed to fetch combo deal", error);
          showToast(error.message || "Error loading combo deal", "error");
        });
    }
  }, [id, isNew]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeal((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFile(file);

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    } else if (file) {
      showToast("Please upload an image file", "error");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!deal.title) {
        showToast("Please enter a title", "error");
        setLoading(false);
        return;
      }

      if (!file && !deal.image) {
        showToast("Please upload an image", "error");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      
      // Add text fields
      formData.append('title', deal.title);
      formData.append('dealHighlight', deal.dealHighlight);
      formData.append('description', deal.description);
      formData.append('currentPrice', deal.currentPrice);
      formData.append('originalPrice', deal.originalPrice);
      formData.append('discount', deal.discount);
      formData.append('requiredItems', deal.requiredItems);
      formData.append('freeItems', deal.freeItems);
      formData.append('dealPrice', deal.dealPrice);
      formData.append('isActive', deal.isActive);
      if (deal.order) formData.append('order', deal.order);

      // Add file if available
      if (file) {
        formData.append('image', file);
      } else if (deal.image && !file && !isNew) {
        // If updating and no new file, send existing image URL as text
        formData.append('image', deal.image);
      }

      let response;
      if (isNew) {
        response = await adminApi.post('/combo-deals', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showToast("Combo deal created successfully!");
      } else {
        response = await adminApi.put(`/combo-deals/${id}`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        showToast("Combo deal updated successfully!");
      }
      
      setTimeout(() => {
        navigate("/admin/combo-deals");
      }, 1500);
    } catch (error) {
      console.error("Failed to save combo deal", error);
      showToast(error.response?.data?.message || error.message || "Error saving combo deal", "error");
      setLoading(false);
    }
  };

  const removeImage = () => {
    setFile(null);
    setPreviewUrl("");
    if (!isNew) {
      setDeal(prev => ({ ...prev, image: "" }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {isNew ? "Add New Combo Deal" : "Edit Combo Deal"}
            </h1>

            {/* Toast Notification */}
            {toast.show && (
              <div
                className={`mb-6 p-4 rounded-lg flex items-center space-x-2 ${
                  toast.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
                }`}
              >
                {toast.type === "error" ? (
                  <AlertCircle className="h-5 w-5" />
                ) : (
                  <CheckCircle className="h-5 w-5" />
                )}
                <span>{toast.message}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={deal.title}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Ultimate Perfume Box"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium text-gray-700">
                      Deal Highlight <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="dealHighlight"
                      value={deal.dealHighlight}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Buy Any 3 for ₹1,298 Only"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={deal.description}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Buy any 3 perfumes, get 1 free"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Pricing Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Current Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="currentPrice"
                      value={deal.currentPrice}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      min="0"
                      step="0.01"
                      placeholder="1298"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Original Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="originalPrice"
                      value={deal.originalPrice}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      min="0"
                      step="0.01"
                      placeholder="2997"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Discount
                    </label>
                    <input
                      type="text"
                      name="discount"
                      value={deal.discount}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="↓57%"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Deal Price (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="dealPrice"
                      value={deal.dealPrice}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      min="0"
                      step="0.01"
                      placeholder="1298"
                    />
                  </div>
                </div>
              </div>

              {/* Items Configuration */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Items Configuration</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Required Items <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="requiredItems"
                      value={deal.requiredItems}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      min="1"
                      placeholder="3"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Free Items
                    </label>
                    <input
                      type="number"
                      name="freeItems"
                      value={deal.freeItems}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      min="0"
                      placeholder="1"
                    />
                  </div>
                </div>
              </div>

              {/* Image Upload */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Image</h2>
                <div
                  className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : previewUrl
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-lg mx-auto"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute top-2 right-2 p-1 bg-red-100 text-red-600 rounded-full hover:bg-red-200 focus:outline-none"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="mx-auto w-12 h-12 text-gray-400">
                        <ImagePlus className="w-12 h-12" />
                      </div>
                      <div className="text-sm text-gray-600">
                        <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                          <span>Upload an image</span>
                          <input
                            type="file"
                            className="sr-only"
                            accept="image/*"
                            onChange={handleFileChange}
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Image up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Settings */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Settings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={deal.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active (Show on website)
                    </label>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={deal.order}
                      onChange={handleChange}
                      min="0"
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Auto-assigned if not set"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Lower numbers appear first. Leave empty for auto-assignment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin/combo-deals")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isNew ? "Create Deal" : "Update Deal"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditComboDeal;

