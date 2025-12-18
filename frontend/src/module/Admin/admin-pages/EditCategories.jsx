import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, ImagePlus, Video, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import categoryService from "../../../services/categoryService";

const EditCategories = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new" || window.location.pathname.includes('/admin/categories/edit/new');

  const [category, setCategory] = useState({
    name: "",
    description: "",
    image: "",
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
      categoryService.getCategory(id)
        .then((response) => {
          const cat = response.data;
          if (cat) {
            setCategory({
              name: cat.name || '',
              description: cat.description || '',
              image: cat.image || '',
            });
            if (cat.image) {
              setPreviewUrls(prev => ({
                ...prev,
                image: cat.image,
              }));
            }
          } else {
            showToast("Category not found", "error");
          }
        })
        .catch((error) => {
          console.error("Failed to fetch category", error);
          showToast(error.message || "Error loading category", "error");
        });
    }
  }, [id, isNew]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCategory((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e, fieldName) => {
    const file = e.target.files?.[0];
    handleFile(file, fieldName);
  };

  const handleFile = (file, fieldName) => {
    if (file && file.type.startsWith('image/')) {
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
      showToast("Please upload an image file", "error");
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
      if (!category.name || !category.description) {
        showToast("Please fill all required fields", "error");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      
      // Add text fields
      formData.append('name', category.name);
      formData.append('description', category.description);

      // Add file if available (only if it's a new file, not existing URL)
      if (files.image) {
        formData.append('image', files.image);
      }
      // Note: If updating and no new file, existing image URL is already in category.image
      // Backend will keep existing image if no new file is uploaded

      let response;
      if (isNew) {
        response = await categoryService.createCategory(formData);
        showToast(response.message || "Category created successfully!");
      } else {
        response = await categoryService.updateCategory(id, formData);
        showToast(response.message || "Category updated successfully!");
      }
      
      setTimeout(() => {
        navigate("/admin/categories");
      }, 1500);
    } catch (error) {
      console.error("Failed to save category", error);
      showToast(error.message || error.response?.data?.message || "Error saving category", "error");
      setLoading(false);
    }
  };

  const removeImage = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setPreviewUrls(prev => ({ ...prev, [fieldName]: "" }));
    if (!isNew) {
      setCategory(prev => ({ ...prev, [fieldName]: "" }));
    }
  };

  const renderFileInput = (fieldName, label, required = false) => {
    const hasPreview = previewUrls[fieldName] || files[fieldName];
    const isDragging = dragOver[fieldName];

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
              <img
                src={previewUrls[fieldName]}
                alt="Preview"
                className="w-full h-48 object-cover rounded-lg"
              />
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
                  <span>Upload an image</span>
                  <input
                    type="file"
                    className="sr-only"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, fieldName)}
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
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
              {isNew ? "Add New Category" : "Edit Category"}
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
                      Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={category.name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Men's Perfume, Women's Perfume"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">
                      Description <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={category.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="Category description..."
                    />
                  </div>
                </div>
              </div>

              {/* Category Media */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Category Image</h2>
                <div className="grid grid-cols-1 gap-6">
                  {renderFileInput('image', 'Category Image')}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin/categories")}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{isNew ? "Create Category" : "Update Category"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCategories;
