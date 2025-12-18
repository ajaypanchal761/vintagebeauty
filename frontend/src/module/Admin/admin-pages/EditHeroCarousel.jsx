import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, ImagePlus, Video, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import heroCarouselService from '../../../services/heroCarouselService';

const EditHeroCarousel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || window.location.pathname.includes('/admin/hero-carousel/new');

  const [carouselItem, setCarouselItem] = useState({
    title: "",
    subtitle: "",
    description: "",
    image: "",
    isActive: true,
    isMobile: false,
    link: "",
    buttonText: "",
    order: 0
  });

  const [files, setFiles] = useState({
    image: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    image: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [dragOver, setDragOver] = useState({
    image: false,
  });

  useEffect(() => {
    if (!isNew && id) {
      heroCarouselService.getCarouselItem(id)
        .then((response) => {
          const item = response.data;
          if (item) {
            setCarouselItem({
              title: item.title || '',
              subtitle: item.subtitle || '',
              description: item.description || '',
              image: item.image || '',
              isActive: item.isActive !== undefined ? item.isActive : true,
              isMobile: item.isMobile || false,
              link: item.link || '',
              buttonText: item.buttonText || '',
              order: item.order || 0
            });
            if (item.image) {
              setPreviewUrls(prev => ({
                ...prev,
                image: item.image,
              }));
            }
          } else {
            showToast("Carousel item not found", "error");
          }
        })
        .catch((error) => {
          console.error("Failed to fetch carousel item", error);
          showToast(error.message || "Error loading carousel item", "error");
        });
    }
  }, [id, isNew]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCarouselItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0];
    handleFile(file, fieldName);
  };

  const handleFile = (file, fieldName) => {
    if (file && (file.type.startsWith('image/') || file.type.startsWith('video/'))) {
      setFiles(prev => ({
        ...prev,
        [fieldName]: file
      }));

      const reader = new FileReader();
      reader.onload = () => {
        setPreviewUrls(prev => ({
          ...prev,
          [fieldName]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    } else if (file) {
      showToast("Please upload an image or video file", "error");
    }
  };

  const handleDrop = (e, fieldName) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [fieldName]: false }));
    
    const file = e.dataTransfer.files[0];
    handleFile(file, fieldName);
  };

  const handleDragOver = (e, fieldName) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [fieldName]: true }));
  };

  const handleDragLeave = (e, fieldName) => {
    e.preventDefault();
    setDragOver(prev => ({ ...prev, [fieldName]: false }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!carouselItem.title) {
        showToast("Please enter a title", "error");
        setLoading(false);
        return;
      }

      if (!files.image && !carouselItem.image) {
        showToast("Please upload an image or video", "error");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      
      // Add text fields
      formData.append('title', carouselItem.title);
      if (carouselItem.subtitle) formData.append('subtitle', carouselItem.subtitle);
      if (carouselItem.description) formData.append('description', carouselItem.description);
      if (carouselItem.link) formData.append('link', carouselItem.link);
      if (carouselItem.buttonText) formData.append('buttonText', carouselItem.buttonText);
      formData.append('isActive', carouselItem.isActive);
      formData.append('isMobile', carouselItem.isMobile);
      if (carouselItem.order) formData.append('order', carouselItem.order);

      // Add file if available (only if it's a new file, not existing URL)
      if (files.image) {
        formData.append('image', files.image);
      } else if (carouselItem.image && !files.image && !isNew) {
        // If updating and no new file, send existing image URL as text
        formData.append('image', carouselItem.image);
      }

      let response;
      if (isNew) {
        response = await heroCarouselService.createCarouselItem(formData);
        showToast(response.message || "Carousel item created successfully!");
      } else {
        response = await heroCarouselService.updateCarouselItem(id, formData);
        showToast(response.message || "Carousel item updated successfully!");
      }
      
      setTimeout(() => {
        navigate("/admin/hero-carousel");
      }, 1500);
    } catch (error) {
      console.error("Failed to save carousel item", error);
      showToast(error.message || error.response?.data?.message || "Error saving carousel item", "error");
      setLoading(false);
    }
  };

  const removeImage = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setPreviewUrls(prev => ({ ...prev, [fieldName]: "" }));
    if (!isNew) {
      setCarouselItem(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  const isVideo = (url) => {
    return url?.toLowerCase().endsWith('.mp4') || url?.toLowerCase().includes('video') || 
           (files.image && files.image.type?.startsWith('video/'));
  };

  const renderFileInput = (fieldName, label, required = false) => {
    const hasPreview = previewUrls[fieldName] || files[fieldName];
    const isDragging = dragOver[fieldName];
    const previewUrl = previewUrls[fieldName];
    const isVideoFile = isVideo(previewUrl);

    return (
      <div className="col-span-1">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`relative border-2 border-dashed rounded-lg p-4 text-center ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : hasPreview
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={(e) => handleDrop(e, fieldName)}
          onDragOver={(e) => handleDragOver(e, fieldName)}
          onDragLeave={(e) => handleDragLeave(e, fieldName)}
        >
          {hasPreview ? (
            <div className="relative">
              {isVideoFile ? (
                <video
                  src={previewUrl}
                  className="w-full h-48 object-cover rounded-lg"
                  controls
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              <button
                type="button"
                onClick={() => removeImage(fieldName)}
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
                  <span>Upload an image or video</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*,video/*"
                    onChange={(e) => handleFileChange(e, fieldName)}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                Image or video up to 10MB
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {isNew ? "Add New Carousel Slide" : "Edit Carousel Slide"}
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
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={carouselItem.title}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Summer Collection"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Subtitle
                    </label>
                    <input
                      type="text"
                      name="subtitle"
                      value={carouselItem.subtitle}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., New Arrivals"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={carouselItem.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="Carousel slide description..."
                    />
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Media</h2>
                <div className="grid grid-cols-1 gap-6">
                  {renderFileInput('image', 'Image or Video', true)}
                </div>
              </div>

              {/* Link and Button */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Link & Button</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">
                      Link URL
                    </label>
                    <input
                      type="url"
                      name="link"
                      value={carouselItem.link}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., /products/summer-collection"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Button Text
                    </label>
                    <input
                      type="text"
                      name="buttonText"
                      value={carouselItem.buttonText}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      placeholder="e.g., Shop Now"
                    />
                  </div>
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
                      checked={carouselItem.isActive}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active (Show on website)
                    </label>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      name="isMobile"
                      checked={carouselItem.isMobile}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Mobile Version
                    </label>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Display Order
                    </label>
                    <input
                      type="number"
                      name="order"
                      value={carouselItem.order}
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
                  onClick={() => navigate("/admin/hero-carousel")}
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
                  <span>{isNew ? "Create Slide" : "Update Slide"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditHeroCarousel;
