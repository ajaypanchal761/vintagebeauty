import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products } from '../api';
import reviewService from '../services/reviewService';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import { useAuthStore } from '../store/authStore';
import Toast from './Toast';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import { pageVariants } from '../utils/pageAnimations';
import toast from 'react-hot-toast';
import { trackProductView, trackAddToCart } from '../utils/activityTracker';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem, getItemCount } = useCartStore();
  const { isAuthenticated } = useAuthStore();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const cartCount = getItemCount();

  // Get active navigation tab
  const getActiveNavTab = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/products' || location.pathname.startsWith('/shop')) return 'Shop All';
    if (location.pathname === '/deals' || location.pathname.startsWith('/combo-deals')) return 'Deals';
    if (location.pathname === '/account') return 'Account';
    return '';
  };

  const activeNavTab = getActiveNavTab();

  // State for product, related products, loading, and error
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for gift set product details
  const [giftSetProductDetails, setGiftSetProductDetails] = useState([]);
  const [loadingGiftSetDetails, setLoadingGiftSetDetails] = useState(false);

  // Fetch detailed information for gift set products
  const fetchGiftSetProductDetails = async (giftSetItems) => {
    if (!giftSetItems || giftSetItems.length === 0) return;

    setLoadingGiftSetDetails(true);
    try {
      const productDetails = [];

      for (const item of giftSetItems) {
        try {
          const response = await products.getById(item.product);
          if (response.success && response.data) {
            productDetails.push({
              ...response.data,
              quantity: item.quantity,
              selectedSize: item.selectedSize
            });
          } else {
            // Add placeholder data for failed requests
            productDetails.push({
              _id: item.product,
              name: `Product ${item.product?.substring(0, 8) || productDetails.length + 1}`,
              description: 'A luxurious fragrance product included in this gift set.',
              images: [heroimg],
              price: 0,
              quantity: item.quantity,
              selectedSize: item.selectedSize
            });
          }
        } catch (error) {
          console.error(`Failed to fetch product ${item.product}:`, error);
          // Add placeholder data for failed requests
          productDetails.push({
            _id: item.product,
            name: `Product ${item.product?.substring(0, 8) || productDetails.length + 1}`,
            description: 'A luxurious fragrance product included in this gift set.',
            images: [heroimg],
            price: 0,
            quantity: item.quantity,
            selectedSize: item.selectedSize
          });
        }
      }

      setGiftSetProductDetails(productDetails);
    } catch (error) {
      console.error('Error fetching gift set product details:', error);
    } finally {
      setLoadingGiftSetDetails(false);
    }
  };

  // State for reviews
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch product by ID
  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      setLoading(true);
      setError(null);
      try {
        // Use centralized API - fetch product from database
        const response = await products.getById(id);
        if (response.success && response.data) {
          const productData = response.data;
          setProduct(productData);

          // Set initial selected size
          if (productData.sizes && productData.sizes.length > 0) {
            // Default to index 2 (standard) if available, otherwise index 0
            const defaultSize = productData.sizes[2] || productData.sizes[0];
            if (defaultSize) {
              setSelectedSize(defaultSize.size);
            }
          }

          // Track product view
          trackProductView(productData);

          // Fetch gift set product details if it's a gift set
          if (productData.isGiftSet && productData.giftSetItems && productData.giftSetItems.length > 0) {
            fetchGiftSetProductDetails(productData.giftSetItems);
          }

          // Fetch related products from same category
          if (productData.category) {
            try {
              // Get category slug from category object or categoryName
              const categorySlug = productData.category?.slug ||
                productData.categoryName?.toLowerCase().replace(/\s+/g, '-') ||
                'perfume';

              const relatedResponse = await products.getAll({
                category: categorySlug,
                limit: 5
              });
              if (relatedResponse.success) {
                const related = (relatedResponse.products || relatedResponse.data || [])
                  .filter(p => (p._id || p.id) !== (productData._id || productData.id))
                  .slice(0, 4)
                  .map(p => ({
                    ...p,
                    id: p._id || p.id,
                    image: p.images?.[0] || p.image || heroimg
                  }));
                setRelatedProducts(related);
              }
            } catch (err) {
              console.error('Error fetching related products:', err);
            }
          }
        } else {
          setError('Product not found');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // Reset active image on id change
  useEffect(() => {
    setActiveImageIndex(0);
  }, [id]);

  // Fetch reviews for the product
  useEffect(() => {
    const fetchReviews = async () => {
      const currentProductId = product?._id || product?.id || id;
      if (!currentProductId) return;

      setLoadingReviews(true);
      try {
        const reviewsResponse = await reviewService.getProductReviews(currentProductId, 1, 10);
        if (reviewsResponse.success) {
          setReviews(reviewsResponse.reviews || []);
        }

        // Only fetch user review if user is authenticated
        if (isAuthenticated) {
          try {
            const userReviewResponse = await reviewService.getUserReview(currentProductId);
            // Service handles 401 gracefully by returning success: false
            if (userReviewResponse.success && userReviewResponse.data) {
              setUserReview(userReviewResponse.data);
              setReviewRating(userReviewResponse.data.rating);
              setReviewComment(userReviewResponse.data.comment || '');
            }
          } catch (error) {
            // Only log non-401 errors (service should handle 401, but catch any unexpected errors)
            if (error?.response?.status !== 401 && error?.status !== 401) {
              console.error('Error fetching user review:', error);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (product?._id || product?.id || id) {
      fetchReviews();
    }
  }, [product, id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">{error || 'Product not found'}</h2>
          <Link to="/products" className="text-[#D4AF37] hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const productImages = product.images && product.images.length > 0
    ? product.images
    : [product.image || heroimg];

  // Determine current size object based on selectedSize
  const currentSizeObj = product.sizes?.find(s => s.size === selectedSize) ||
    (product.sizes?.[2] || product.sizes?.[0]);

  let price = '';
  if (currentSizeObj?.price) {
    price = `₹${currentSizeObj.price}`;
  } else if (product.price) {
    price = `₹${product.price}`;
  } else {
    price = '₹699';
  }

  const size = selectedSize || currentSizeObj?.size || product.size || '100ml';
  const brandName = product.brandName || 'VINTAGE BEAUTY';
  const rating = product.rating || 0;
  const productId = product._id || product.id;
  const stockValue = Number(product?.stock);
  const isOutOfStock = product?.inStock === false || (Number.isFinite(stockValue) && stockValue <= 0);

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const nextValue = Math.max(1, prev + delta);
      if (Number.isFinite(stockValue)) {
        return Math.min(nextValue, stockValue);
      }
      return nextValue;
    });
  };

  const handleAddToCart = async () => {
    if (isOutOfStock) {
      setToastMessage('This item is out of stock');
      setShowToast(true);
      return;
    }

    if (Number.isFinite(stockValue) && quantity > stockValue) {
      setToastMessage(`Only ${stockValue} left in stock`);
      setShowToast(true);
      return;
    }

    const sizeValue = selectedSize || (product.sizes?.[2]?.size || product.sizes?.[0]?.size || '100ml');
    try {
      await addItem(product, quantity, sizeValue);

      // Track add to cart activity
      trackAddToCart(product, quantity);

      setToastMessage(`${product.name} added to cart!`);
      setShowToast(true);
    } catch (err) {
      console.error(err);
      setToastMessage(err?.message || 'Failed to add to cart');
      setShowToast(true);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewRating || reviewRating < 1) {
      toast.error('Please select a rating');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please login to submit a review');
      navigate('/account');
      return;
    }

    setSubmittingReview(true);
    try {
      if (userReview) {
        await reviewService.updateReview(userReview._id, reviewRating, reviewComment);
        toast.success('Review updated successfully!');
      } else {
        await reviewService.createReview(productId, reviewRating, reviewComment);
        toast.success('Review submitted successfully!');
      }

      // Use centralized API - refresh product from database
      const productResponse = await products.getById(productId);
      if (productResponse.success && productResponse.data) {
        setProduct(productResponse.data);
      }

      const reviewsResponse = await reviewService.getProductReviews(productId, 1, 10);
      if (reviewsResponse.success) {
        setReviews(reviewsResponse.reviews || []);
      }

      const userReviewResponse = await reviewService.getUserReview(productId);
      if (userReviewResponse.success && userReviewResponse.data) {
        setUserReview(userReviewResponse.data);
      } else {
        setUserReview(null);
      }

      setShowReviewForm(false);
    } catch (err) {
      console.error('Error submitting review:', err);
      toast.error(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white overflow-x-hidden pb-24 md:pb-0"
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {/* Navigation Bar */}
      <motion.nav
        className="w-full bg-black border-b border-gray-800 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between lg:relative lg:flex lg:items-center">
            {/* Mobile Back Button + Logo/Brand Name - Left Section */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Back Button - Mobile Only */}
              <button
                onClick={() => navigate(-1)}
                className="md:hidden p-2 hover:bg-gray-900 rounded-lg transition-colors"
                aria-label="Back"
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Logo/Brand Name */}
              {logo && (
                <img
                  src={logo}
                  alt="VINTAGE BEAUTY Logo"
                  className="h-6 md:h-8 w-auto"
                />
              )}
              <h1 className="text-base md:text-xl lg:text-2xl font-semibold uppercase tracking-wider text-white">
                VINTAGE BEAUTY
              </h1>
            </div>

            {/* Navigation Links - Desktop Only - Centered */}
            <nav className="hidden md:flex items-center justify-center gap-6 lg:gap-8 lg:absolute lg:left-1/2 lg:transform lg:-translate-x-1/2">
              <Link
                to="/"
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${activeNavTab === 'Home'
                  ? 'text-[#D4AF37]'
                  : 'text-gray-400 hover:text-[#D4AF37]'
                  }`}
              >
                Home
                {activeNavTab === 'Home' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
                )}
              </Link>
              <Link
                to="/products"
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${activeNavTab === 'Shop All'
                  ? 'text-[#D4AF37]'
                  : 'text-gray-400 hover:text-[#D4AF37]'
                  }`}
              >
                Shop All
                {activeNavTab === 'Shop All' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
                )}
              </Link>
              <Link
                to="/deals"
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${activeNavTab === 'Deals'
                  ? 'text-[#D4AF37]'
                  : 'text-gray-400 hover:text-[#D4AF37]'
                  }`}
              >
                Deals
                {activeNavTab === 'Deals' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
                )}
              </Link>
              <Link
                to="/account"
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${activeNavTab === 'Account'
                  ? 'text-[#D4AF37]'
                  : 'text-gray-400 hover:text-[#D4AF37]'
                  }`}
              >
                Account
                {activeNavTab === 'Account' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#D4AF37]"></span>
                )}
              </Link>
            </nav>

            {/* Shopping Bag Icon */}
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.nav>

      {/* Product Image Section */}
      <motion.div
        className="w-full bg-black"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="flex flex-col items-center pb-8">
          <div className="relative w-full flex justify-center items-center h-[400px] md:h-[500px] lg:h-[600px] mb-4">
            {productImages.length > 1 && (
              <button
                onClick={() => setActiveImageIndex((prev) => (prev === 0 ? productImages.length - 1 : prev - 1))}
                className="absolute left-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            <motion.img
              key={activeImageIndex}
              src={productImages[activeImageIndex]}
              alt={product.name}
              className="w-full max-w-xs md:max-w-md lg:max-w-lg h-full object-contain rounded-2xl md:rounded-3xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              onError={(e) => {
                e.target.src = heroimg;
              }}
            />

            {productImages.length > 1 && (
              <button
                onClick={() => setActiveImageIndex((prev) => (prev === productImages.length - 1 ? 0 : prev + 1))}
                className="absolute right-4 z-10 p-2 bg-black/50 hover:bg-black/80 rounded-full text-white transition-colors"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Thumbnails */}
          {productImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto px-4 w-full justify-center no-scrollbar py-2">
              {productImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-300 ${activeImageIndex === idx
                    ? 'ring-2 ring-[#D4AF37] scale-105 opacity-100'
                    : 'opacity-50 hover:opacity-80 hover:scale-105'
                    }`}
                >
                  <img
                    src={img}
                    alt={`View ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = heroimg;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Product Details Card */}
      <motion.div
        className="bg-[#3A2E1F] md:bg-[#4A3A2A] rounded-t-3xl md:rounded-t-[40px] -mt-8 md:-mt-12 relative z-10"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="container mx-auto px-4 md:px-6 py-6 md:py-8">
          {/* 4 Specification Boxes */}
          <div className="grid grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6">
            <div className="bg-black bg-opacity-30 rounded-lg p-2 md:p-3 text-center">
              <p className="text-xs md:text-xs text-gray-300 mb-1">{product.isGiftSet ? 'Type' : 'Size'}</p>
              <p className="text-sm md:text-sm font-bold text-white">{product.isGiftSet ? 'Gift Set' : size}</p>
            </div>
            <div className="bg-black bg-opacity-30 rounded-lg p-2 md:p-3 text-center">
              <p className="text-[10px] md:text-xs text-gray-300 mb-1">Purity</p>
              <p className="text-xs md:text-sm font-bold text-white">100% Pure</p>
            </div>
            <div className="bg-black bg-opacity-30 rounded-lg p-2 md:p-3 text-center">
              <p className="text-[10px] md:text-xs text-gray-300 mb-1">Rating</p>
              <p className="text-xs md:text-sm font-bold text-white">{rating} ⭐</p>
            </div>
            <div className="bg-black bg-opacity-30 rounded-lg p-2 md:p-3 text-center">
              <p className="text-[10px] md:text-xs text-gray-300 mb-1">Brand</p>
              <p className="text-xs md:text-sm font-bold text-white truncate">{brandName}</p>
            </div>
          </div>

          {/* Product Name and Price */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-white flex-1">
              {product.name}
            </h2>
            <p className="text-lg md:text-xl lg:text-2xl font-bold text-[#D4AF37] ml-4">
              {price}
            </p>
          </div>

          {/* Size Selector - Hidden for Gift Sets */}
          {product.sizes && product.sizes.length > 0 && !product.isGiftSet && (
            <div className="mb-6">
              <p className="text-sm text-gray-300 mb-3">Select Size</p>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((s, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedSize(s.size)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${selectedSize === s.size
                      ? 'bg-[#D4AF37] text-black border-[#D4AF37]'
                      : 'bg-transparent text-white border-gray-600 hover:border-[#D4AF37] hover:text-[#D4AF37]'
                      }`}
                  >
                    {s.size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Description */}
          <div className="mb-6 md:mb-8">
            <p className="text-sm md:text-base text-gray-300 leading-relaxed">
              {product.description || product.scentProfile || 'Premium fragrance from Vintage Beauty. Experience luxury and elegance with this exquisite scent.'}
            </p>
          </div>

          {/* Gift Set Contents Section */}
          {product.isGiftSet && product.giftSetItems && product.giftSetItems.length > 0 && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">What's Inside This Gift Set</h3>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                {loadingGiftSetDetails ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
                    <span className="ml-3 text-gray-300">Loading gift set products...</span>
                  </div>
                ) : giftSetProductDetails.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {giftSetProductDetails.map((productDetail, index) => (
                      <div key={productDetail._id || index} className="bg-gray-800 bg-opacity-50 rounded-lg p-3 border border-gray-700 text-center hover:bg-opacity-70 transition-all duration-200">
                        {/* Product Image */}
                        <div className="relative mb-2">
                          <img
                            src={productDetail.images?.[0] || heroimg}
                            alt={productDetail.name || `Product ${index + 1}`}
                            className="w-full h-20 md:h-24 object-cover rounded-md border-2 border-[#D4AF37] shadow-lg"
                            onError={(e) => {
                              e.target.src = heroimg;
                            }}
                          />
                          {/* Quantity Badge */}
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-[#D4AF37] rounded-full flex items-center justify-center text-black font-bold text-xs shadow-lg">
                            {productDetail.quantity}
                          </div>
                        </div>

                        {/* Product Name */}
                        <h4 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                          {productDetail.name || `Product ${index + 1}`}
                        </h4>

                        {/* Size Info */}
                        {productDetail.selectedSize && (
                          <p className="text-xs text-[#D4AF37] font-medium">
                            {productDetail.selectedSize}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : product.giftSetItems.length > 0 ? (
                  <div className="text-center py-8">
                    <div className="text-gray-400 mb-2">🎁</div>
                    <p className="text-gray-300">
                      This gift set contains {product.giftSetItems.length} premium fragrance product{product.giftSetItems.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">
                      Product details are being loaded...
                    </p>
                  </div>
                ) : null}

                {/* Gift Set Summary */}
                {giftSetProductDetails.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-300">Total Products in Set:</span>
                      <span className="text-white font-bold">{giftSetProductDetails.length} Premium Items</span>
                    </div>
                    {product.giftSetDiscount > 0 && (
                      <>
                        <div className="flex items-center justify-between text-sm mt-2">
                          <span className="text-gray-300">Total Value:</span>
                          <span className="text-gray-400 line-through">
                            ₹{giftSetProductDetails.reduce((total, item) => total + (item.price * item.quantity), 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-green-400">You Save:</span>
                          <span className="text-green-400 font-bold">
                            ₹{(giftSetProductDetails.reduce((total, item) => total + (item.price * item.quantity), 0) - product.price).toFixed(2)} {product.giftSetManualPrice ? '(Custom Pricing)' : `(${product.giftSetDiscount}%)`}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Material/Fragrance Type Section */}
          {product.material && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">Material/Fragrance Type</h3>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {product.material}
                </p>
              </div>
            </div>
          )}

          {/* Colour/Fragrance Notes Section */}
          {product.colour && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">Colour/Fragrance Notes</h3>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <p className="text-sm md:text-base text-gray-300 leading-relaxed">
                  {product.colour}
                </p>
              </div>
            </div>
          )}

          {/* Fragrance Notes/Utility Section */}
          {product.utility && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">Fragrance Notes/Utility</h3>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.utility}
                </p>
              </div>
            </div>
          )}

          {/* Care Instructions Section */}
          {product.care && (
            <div className="mb-6 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-3">Care Instructions</h3>
              <div className="bg-black bg-opacity-20 rounded-lg p-4">
                <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-line">
                  {product.care}
                </p>
              </div>
            </div>
          )}

          {/* Reviews Section */}
          <div className="mb-6 md:mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg md:text-xl font-bold text-white">Reviews & Ratings</h3>
              {localStorage.getItem('token') && (
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-sm text-[#D4AF37] hover:text-[#F4D03F] transition-colors font-semibold"
                >
                  {userReview ? 'Edit Review' : 'Write a Review'}
                </button>
              )}
            </div>

            {/* Overall Rating Display */}
            <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => {
                    const starValue = i + 1;
                    const isFull = starValue <= Math.floor(rating);
                    const isHalf = !isFull && starValue - 0.5 <= rating;
                    return (
                      <svg
                        key={i}
                        className={`w-5 h-5 ${isFull ? 'text-[#D4AF37]' : isHalf ? 'text-[#D4AF37]' : 'text-gray-600'}`}
                        fill={isFull || isHalf ? 'currentColor' : 'none'}
                        stroke={isHalf ? 'currentColor' : 'none'}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    );
                  })}
                </div>
                <span className="text-sm text-gray-300">({rating > 0 ? rating.toFixed(1) : '0.0'} out of 5)</span>
                {(product.reviews || 0) > 0 && (
                  <span className="text-sm text-gray-400">• {product.reviews || 0} {(product.reviews || 0) === 1 ? 'review' : 'reviews'}</span>
                )}
              </div>
              <p className="text-sm text-gray-400">Based on customer reviews</p>
            </div>

            {/* Review Form */}
            {showReviewForm && (
              <div className="bg-black bg-opacity-20 rounded-lg p-4 mb-4">
                <h4 className="text-base font-semibold text-white mb-3">
                  {userReview ? 'Edit Your Review' : 'Write a Review'}
                </h4>

                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">Rating *</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="focus:outline-none transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 ${star <= reviewRating ? 'text-[#D4AF37]' : 'text-gray-600'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm text-gray-300 mb-2">Your Review (Optional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    className="w-full bg-gray-900 text-white rounded-lg p-3 border border-gray-700 focus:border-[#D4AF37] focus:outline-none resize-none"
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-400 mt-1">{reviewComment.length}/1000 characters</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating === 0}
                    className="bg-[#D4AF37] hover:bg-[#F4D03F] disabled:bg-gray-700 disabled:cursor-not-allowed text-black font-bold px-6 py-2 rounded-lg transition-all duration-300"
                  >
                    {submittingReview ? 'Submitting...' : userReview ? 'Update Review' : 'Submit Review'}
                  </button>
                  <button
                    onClick={() => {
                      setShowReviewForm(false);
                      if (!userReview) {
                        setReviewRating(0);
                        setReviewComment('');
                      }
                    }}
                    className="bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-2 rounded-lg transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Existing Reviews List */}
            {loadingReviews ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37] mx-auto"></div>
              </div>
            ) : reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review._id} className="bg-black bg-opacity-20 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating ? 'text-[#D4AF37]' : 'text-gray-600'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-white">{review.userName || review.user?.name || 'Anonymous'}</span>
                      </div>
                      <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-300 mt-2">{review.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-black bg-opacity-20 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-400">No reviews yet. Be the first to review this product!</p>
              </div>
            )}
          </div>

          {/* Recommended Products */}
          {relatedProducts.length > 0 && (
            <div className="mb-24 md:mb-8">
              <h3 className="text-lg md:text-xl font-bold text-white mb-4">Recommended Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {relatedProducts.map((relatedProduct) => {
                  const relatedId = relatedProduct._id || relatedProduct.id;
                  const relatedPrice = relatedProduct.isGiftSet
                    ? `₹${relatedProduct.giftSetManualPrice || relatedProduct.price || relatedProduct.giftSetDiscountedPrice || 699}`
                    : (relatedProduct.price
                      ? `₹${relatedProduct.price}`
                      : (relatedProduct.sizes && relatedProduct.sizes.length > 0
                        ? `₹${relatedProduct.sizes[2]?.price || relatedProduct.sizes[0]?.price}`
                        : '₹699'));

                  return (
                    <Link
                      key={relatedId}
                      to={`/product/${relatedId}`}
                      className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer block"
                    >
                      <div className="relative h-32 md:h-40 bg-gray-800 overflow-hidden">
                        <img
                          src={relatedProduct.image || heroimg}
                          alt={relatedProduct.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = heroimg;
                          }}
                        />
                      </div>
                      <div className="p-2 md:p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="text-xs md:text-sm font-semibold text-white flex-1 truncate hover:text-[#D4AF37] transition-colors">
                            {relatedProduct.name}
                          </h4>
                          <p className="text-xs font-bold text-[#D4AF37] whitespace-nowrap">
                            {relatedPrice}
                          </p>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Fixed Bottom Bar - Quantity and Add to Cart */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#3A2E1F] md:bg-[#4A3A2A] border-t border-gray-700 p-4 md:hidden z-50">
        <div className="container mx-auto flex items-center gap-3">
          <div className="flex items-center gap-2 bg-black bg-opacity-30 rounded-lg px-3 py-2">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white font-bold px-3 min-w-[30px] text-center">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={isOutOfStock || (Number.isFinite(stockValue) && quantity >= stockValue)}
              className="text-white hover:text-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`flex-1 font-bold px-4 py-3 rounded-lg text-sm transition-all duration-300 shadow-lg flex items-center justify-center gap-2 ${isOutOfStock
              ? 'bg-gray-600 text-gray-200 cursor-not-allowed'
              : 'bg-[#D4AF37] hover:bg-[#F4D03F] text-black'
              }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isOutOfStock ? 'Out of stock' : 'Add to cart'}</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Add to Cart Section */}
      <div className="hidden md:block bg-[#3A2E1F] md:bg-[#4A3A2A] border-t border-gray-700 p-6 sticky bottom-0 z-40">
        <div className="container mx-auto flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 bg-black bg-opacity-30 rounded-lg px-4 py-3">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="text-white hover:text-[#D4AF37] transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span className="text-white font-bold px-4 min-w-[40px] text-center text-lg">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              disabled={isOutOfStock || (Number.isFinite(stockValue) && quantity >= stockValue)}
              className="text-white hover:text-[#D4AF37] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={`font-bold px-8 py-3 rounded-lg text-base transition-all duration-300 shadow-lg flex items-center justify-center gap-3 min-w-[200px] ${isOutOfStock
              ? 'bg-gray-600 text-gray-200 cursor-not-allowed'
              : 'bg-[#D4AF37] hover:bg-[#F4D03F] text-black'
              }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>{isOutOfStock ? 'Out of stock' : 'Add to cart'}</span>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </motion.div>
  );
};

export default ProductDetail;


