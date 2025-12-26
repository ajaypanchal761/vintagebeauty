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
    video: "",
    mediaType: "image", // "image" or "video" - always has a default value
    isActive: true,
    isMobile: false,
    link: "",
    buttonText: "",
    order: 0
  });

  const [files, setFiles] = useState({
    image: null,
    video: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    image: "",
    video: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [dragOver, setDragOver] = useState({
    image: false,
    video: false,
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
              video: item.video || '',
              mediaType: item.video ? 'video' : 'image',
              isActive: item.isActive !== undefined ? item.isActive : true,
              isMobile: item.isMobile || false,
              link: item.link || '',
              buttonText: item.buttonText || '',
              order: item.order || 0
            });

            // Set preview URLs for existing media
            if (item.image) {
              setPreviewUrls(prev => ({ ...prev, image: item.image }));
            }
            if (item.video) {
              setPreviewUrls(prev => ({ ...prev, video: item.video }));
            }
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
    if (file) {
      // Validate file type based on field
      if (fieldName === 'image' && !file.type.startsWith('image/')) {
        showToast("Please select a valid image file", "error");
        return;
      }
      if (fieldName === 'video' && !file.type.startsWith('video/')) {
        showToast("Please select a valid video file", "error");
        return;
      }

      // Validate video duration (max 20 seconds)
      if (fieldName === 'video') {
        const video = document.createElement('video');
        video.preload = 'metadata';

        video.onloadedmetadata = () => {
          window.URL.revokeObjectURL(video.src);
          if (video.duration > 60) {
            showToast("Video must be 1 minute (60 seconds) or shorter", "error");
            return;
          }

          // Video is valid, proceed with upload
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
        };

        video.onerror = () => {
          window.URL.revokeObjectURL(video.src);
          showToast("Unable to read video file", "error");
        };

        video.src = window.URL.createObjectURL(file);
        return; // Exit early, validation will continue in onloadedmetadata
      }

      // For images, proceed normally
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

      // Check if media is provided based on media type
      if (carouselItem.mediaType === 'image' && !files.image && !carouselItem.image) {
        showToast("Please upload an image", "error");
        setLoading(false);
        return;
      }
      if (carouselItem.mediaType === 'video' && !files.video && !carouselItem.video) {
        showToast("Please upload a video", "error");
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

      // Add media files based on media type
      if (carouselItem.mediaType === 'image') {
        if (files.image) {
          formData.append('image', files.image);
        } else if (carouselItem.image && !files.image && !isNew) {
          formData.append('image', carouselItem.image);
        }
        // Clear video field
        formData.append('video', '');
      } else if (carouselItem.mediaType === 'video') {
        if (files.video) {
          formData.append('video', files.video);
        } else if (carouselItem.video && !files.video && !isNew) {
          formData.append('video', carouselItem.video);
        }
        // Clear image field
        formData.append('image', '');
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

  const isVideo = (url, fieldName) => {
    if (fieldName === 'video') return true;
    if (fieldName === 'image') return false;
    return url?.toLowerCase().endsWith('.mp4') || url?.toLowerCase().endsWith('.webm') ||
           url?.toLowerCase().endsWith('.ogg') || url?.toLowerCase().includes('video');
  };

  const renderFileInput = (fieldName, label, required = false) => {
    const hasPreview = previewUrls[fieldName] || files[fieldName];
    const isDragging = dragOver[fieldName];
    const previewUrl = previewUrls[fieldName];
    const isVideoFile = isVideo(previewUrl, fieldName);

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
                    accept={fieldName === 'image' ? 'image/*' : 'video/*'}
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

              {/* Media Type Selection */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Media Type</h2>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-3">
                      Select Media Type <span className="text-red-500">*</span>
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mediaType"
                          value="image"
                          checked={carouselItem.mediaType === 'image'}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <ImagePlus className="w-4 h-4 mr-1" />
                          Image
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="mediaType"
                          value="video"
                          checked={carouselItem.mediaType === 'video'}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <span className="ml-2 text-sm text-gray-700 flex items-center">
                          <Video className="w-4 h-4 mr-1" />
                          Video
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Media Upload */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  {carouselItem.mediaType === 'image' ? 'Image Upload' : 'Video Upload'}
                </h2>
                {carouselItem.mediaType === 'video' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Video Requirements:</strong> Maximum 1 minute (60 seconds) duration. Videos longer than 60 seconds will be rejected.
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 gap-6">
                  {carouselItem.mediaType === 'image'
                    ? renderFileInput('image', 'Image', true)
                    : renderFileInput('video', 'Video', true)
                  }
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
