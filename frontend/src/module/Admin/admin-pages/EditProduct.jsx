import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, ImagePlus, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import productService from "../../../services/productService";
import categoryService from "../../../services/categoryService";

const EditProduct = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Check if this is a new product based on URL path
  const isNew = window.location.pathname.includes('/admin/products/new') || id === "new";

  const [product, setProduct] = useState({
    name: "",
    material: "",
    description: "",
    size: "",
    colour: "",
    category: "",
    utility: "",
    care: "",
    price: "",
    regularPrice: "",
    inStock: true,
    isBestSeller: false,
    isFeatured: false,
    isMostLoved: false,
    codAvailable: false,
    stock: 0
  });

  const [files, setFiles] = useState({
    mainImage: null,
    image1: null,
    image2: null,
    image3: null,
  });

  const [previewUrls, setPreviewUrls] = useState({
    mainImage: "",
    image1: "",
    image2: "",
    image3: "",
  });

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [dragOver, setDragOver] = useState({
    mainImage: false,
    image1: false,
    image2: false,
    image3: false,
  });

  useEffect(() => {
    // Fetch categories when component mounts
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoryService.getCategories();
        setCategories(response.data.categories || response.categories || []);
      } catch (error) {
        console.error("Failed to fetch categories", error);
        showToast(error.message || "Failed to load categories", "error");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();

    if (!isNew) {
      productService.getProduct(id)
        .then((response) => {
          const prod = response.data;
          
          if (prod) {
            // Handle category - it might be populated object or just ID
            const categoryId = prod.category?._id || prod.category || "";
            
            setProduct({
              ...prod,
              category: categoryId,
              price: prod.price?.toString() || "",
              regularPrice: prod.regularPrice?.toString() || "",
              inStock: !!prod.inStock,
              isBestSeller: !!prod.isBestSeller,
              isFeatured: !!prod.isFeatured,
              isMostLoved: !!prod.isMostLoved,
              codAvailable: !!prod.codAvailable,
              stock: typeof prod.stock !== 'undefined' ? prod.stock : 0
            });

            // Set preview URLs for existing images
            if (prod.images && Array.isArray(prod.images)) {
              const imageMapping = {
                mainImage: prod.images[0] || "",
                image1: prod.images[1] || "",
                image2: prod.images[2] || "",
                image3: prod.images[3] || "",
              };
              setPreviewUrls(imageMapping);
            } else if (prod.image) {
              setPreviewUrls({
                mainImage: prod.image,
                image1: "",
                image2: "",
                image3: "",
              });
            }
          } else {
            showToast("Product not found", "error");
          }
        })
        .catch((error) => {
          console.error("Failed to fetch product:", error);
          showToast(error.message || "Error loading product", "error");
        });
    }
  }, [id, isNew]);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
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
      // Validate required fields
      const requiredFields = [
        "name",
        "material",
        "description",
        "size",
        "colour",
        "category",
        "utility",
        "care",
        "price",
        "regularPrice"
      ];

      const missingFields = requiredFields.filter(field => !product[field]);
      if (missingFields.length > 0) {
        showToast(`Please fill in the following required fields: ${missingFields.join(", ")}`, "error");
        setLoading(false);
        return;
      }

      // Validate price and regularPrice
      const price = parseFloat(product.price);
      const regularPrice = parseFloat(product.regularPrice);
      
      if (isNaN(price) || price < 0) {
        showToast("Please enter a valid price", "error");
        setLoading(false);
        return;
      }

      if (isNaN(regularPrice) || regularPrice < 0) {
        showToast("Please enter a valid regular price", "error");
        setLoading(false);
        return;
      }

      if (price > regularPrice) {
        showToast("Price cannot be greater than regular price", "error");
        setLoading(false);
        return;
      }

      // Validate category selection
      if (!product.category) {
        showToast("Please select a category", "error");
        setLoading(false);
        return;
      }

      // Create FormData
      const formData = new FormData();
      
      // Add all product fields to FormData
      Object.keys(product).forEach(key => {
        if (product[key] !== undefined && product[key] !== null) {
          formData.append(key, product[key]);
        }
      });

      // Add files to FormData
      if (files.mainImage) {
        formData.append('mainImage', files.mainImage);
      }

      for (let i = 1; i <= 3; i++) {
        if (files[`image${i}`]) {
          formData.append(`image${i}`, files[`image${i}`]);
        }
      }

      let response;
      if (isNew) {
        response = await productService.createProduct(formData);
      } else {
        const productId = id;
        if (!productId) {
          showToast("Product ID not found", "error");
          setLoading(false);
          return;
        }
        response = await productService.updateProduct(productId, formData);
      }

      showToast(
        response.message || (isNew ? "Product created successfully!" : "Product updated successfully!"),
        "success"
      );
      
      // Navigate back after success
      setTimeout(() => {
        navigate('/admin/products');
      }, 1500);
    } catch (error) {
      console.error('Error details:', error);
      const errorMessage = error.message || error.response?.data?.message || "An error occurred";
      showToast(errorMessage, "error");
      setLoading(false);
    }
  };

  const removeImage = (fieldName) => {
    setFiles(prev => ({ ...prev, [fieldName]: null }));
    setPreviewUrls(prev => ({ ...prev, [fieldName]: "" }));
  };

  const renderFileInput = (fieldName, label, required = false) => {
    const hasPreview = previewUrls[fieldName] || files[fieldName];
    const isDragging = dragOver[fieldName];

    return (
      <div className="col-span-1">
        <label className="block font-medium mb-2 text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div
          className={`relative h-48 rounded-lg border-2 border-dashed transition-all duration-200 ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          } ${hasPreview ? 'bg-gray-50' : 'bg-white'}`}
          onDrop={(e) => handleDrop(e, fieldName)}
          onDragOver={(e) => handleDragOver(e, fieldName)}
          onDragLeave={(e) => handleDragLeave(e, fieldName)}
        >
          {hasPreview ? (
            <div className="relative h-full">
              <img
                src={previewUrls[fieldName] || URL.createObjectURL(files[fieldName])}
                alt={`Preview ${label}`}
                className="w-full h-full object-contain rounded-lg"
              />
              <button
                type="button"
                onClick={() => removeImage(fieldName)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
              <ImagePlus className="w-12 h-12 mb-2" />
              <p className="text-sm font-medium">Drag & drop or click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB</p>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleFileChange(e, fieldName)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
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
              {isNew ? "Add New Product" : "Edit Product"}
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">Product Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={product.name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Luxury Perfume Gift Set"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Material/Fragrance Type *</label>
                    <input
                      type="text"
                      name="material"
                      value={product.material}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Eau de Parfum, Eau de Toilette"
                    />
                  </div>

                  {/* Category Selection */}
                  <div className="md:col-span-2">
                    <label className="block font-medium text-gray-700 mb-3">
                      Product Category *
                      {!loadingCategories && (
                        <span className="text-sm text-gray-500 ml-2">
                          ({categories.length} categories available)
                        </span>
                      )}
                    </label>
                    
                    {loadingCategories ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        <span className="text-sm text-gray-500">Loading categories...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {categories.map((cat) => (
                          <div
                            key={cat._id}
                            className={`p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
                              product.category === cat._id
                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                            onClick={() => {
                              setProduct(prev => ({
                                ...prev,
                                category: cat._id
                              }));
                            }}
                          >
                            <div className="flex items-center space-x-3">
                              {cat.image && (
                                <img
                                  src={cat.image}
                                  alt={cat.name}
                                  className="w-10 h-10 rounded-lg object-cover"
                                />
                              )}
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 text-sm">{cat.name}</h3>
                                {cat.description && (
                                  <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                                )}
                              </div>
                              {product.category === cat._id && (
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Selected Category Display */}
                  {product.category && (
                    <div className="md:col-span-2">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-700 mb-2">Selected Category:</h4>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
                            <span className="font-medium">Category:</span>
                            <span className="ml-1">
                              {categories.find(cat => cat._id === product.category)?.name}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setProduct(prev => ({
                                  ...prev,
                                  category: ""
                                }));
                              }}
                              className="ml-2 text-blue-600 hover:text-blue-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block font-medium text-gray-700">Size/Volume *</label>
                    <input
                      type="text"
                      name="size"
                      value={product.size}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., 50ml, 100ml"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Colour/Fragrance Notes *</label>
                    <input
                      type="text"
                      name="colour"
                      value={product.colour}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Floral, Woody, Citrus"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Price (₹) *</label>
                    <input
                      type="number"
                      name="price"
                      value={product.price}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      step="0.01"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Regular Price (₹) *</label>
                    <input
                      type="number"
                      name="regularPrice"
                      value={product.regularPrice}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      step="0.01"
                      required
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Stock Quantity *</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      value={product.stock || 0}
                      onChange={handleChange}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                    />
                  </div>

                  <div className="flex items-center mt-2">
                    <input
                      type="checkbox"
                      id="codAvailable"
                      name="codAvailable"
                      checked={!!product.codAvailable}
                      onChange={handleChange}
                      className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="codAvailable" className="ml-2 text-gray-700 font-medium">
                      Cash on Delivery Available
                    </label>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Information</h2>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block font-medium text-gray-700">Description *</label>
                    <textarea
                      name="description"
                      value={product.description}
                      onChange={handleChange}
                      rows={4}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="Product description..."
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Fragrance Notes/Utility *</label>
                    <textarea
                      name="utility"
                      value={product.utility}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Top notes: Bergamot, Middle notes: Rose, Base notes: Sandalwood"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700">Care Instructions *</label>
                    <textarea
                      name="care"
                      value={product.care}
                      onChange={handleChange}
                      rows={3}
                      className="mt-1 block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
                      required
                      placeholder="e.g., Store in a cool, dry place. Keep away from direct sunlight."
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="inStock"
                        checked={product.inStock}
                        onChange={handleChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-700">In Stock</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Product Sections */}
              <div className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium text-gray-700">
                      Product Sections
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isBestSeller"
                          checked={product.isBestSeller}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Best Seller</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isFeatured"
                          checked={product.isFeatured}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Featured</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          name="isMostLoved"
                          checked={product.isMostLoved}
                          onChange={handleChange}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Most Loved</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Images */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Product Images</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {renderFileInput('mainImage', 'Main Image', true)}
                  {renderFileInput('image1', 'Additional Image 1')}
                  {renderFileInput('image2', 'Additional Image 2')}
                  {renderFileInput('image3', 'Additional Image 3')}
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
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
                  <span>{isNew ? "Create Product" : "Update Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg transition-all transform ${
          toast.show ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
        } ${
          toast.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        }`}>
          <div className="flex items-center space-x-2 text-white">
            {toast.type === 'error' ? (
              <AlertCircle size={20} />
            ) : (
              <CheckCircle size={20} />
            )}
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditProduct;
