import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import { fadeInUp, staggerContainer, staggerItem, buttonHover, cardHover } from '../utils/animations';
import { products as productsService } from '../api';
import { useWishlistStore } from '../store/wishlistStore';
import { useCartStore } from '../store/cartStore';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import { trackCategoryVisit, trackProductView } from '../utils/activityTracker';

const Products = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleItem, isInWishlist } = useWishlistStore();
  const { addItem, getItemCount } = useCartStore();
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

  // State for products, loading, and error
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for selected category - initialize from URL query params
  const [selectedCategory, setSelectedCategory] = useState(() => {
    const searchParams = new URLSearchParams(location.search);
    const category = searchParams.get('category');
    if (category) {
      // Convert category slug to display name
      const categoryMap = {
        'perfume': 'Perfume',
        'room-spray': 'Room Spray',
        'pocket-perfume': 'Pocket Perfume',
        'after-shave': 'After Shave',
        'gift-set': 'Gift Set'
      };
      return categoryMap[category] || category;
    }
    return null;
  });

  // Fetch products from backend
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        // Use centralized API - fetch all products from database
        const response = await productsService.getAll();
        if (response.success) {
          // Process products to format prices and images
          const processedProducts = (response.products || response.data || []).map((product) => {
            // Get primary image from Cloudinary
            const image = product.images?.[0] || product.image || heroimg;
            
            // Format price
            let price = '';
            if (product.price) {
              price = `₹${product.price}`;
            } else if (product.sizes && product.sizes.length > 0) {
              // Use 100ml price (index 2) or first available size
              const priceSize = product.sizes[2] || product.sizes[0];
              price = `₹${priceSize.price}`;
            } else {
              price = '₹699';
            }

            return {
              ...product,
              id: product._id || product.id,
              image,
              price,
              displayPrice: price,
            };
          });
          setProducts(processedProducts);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError(err.message || 'Failed to load products');
        toast.error('Failed to load products', {
          style: {
            background: '#1F1F1F',
            color: '#fff',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
          },
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Track category visit when category is selected from URL
  useEffect(() => {
    if (selectedCategory) {
      trackCategoryVisit(selectedCategory);
    }
  }, [selectedCategory]);

  const handleWishlistToggle = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    const productId = product._id || product.id;
    const wasInWishlist = isInWishlist(productId);
    
    try {
      await toggleItem(product);
      
      if (wasInWishlist) {
        toast.success('Item removed from wishlist', {
          style: {
            background: '#1F1F1F',
            color: '#fff',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#1F1F1F',
          },
        });
      } else {
        toast.success('Item added to wishlist', {
          style: {
            background: '#1F1F1F',
            color: '#fff',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
          },
          iconTheme: {
            primary: '#D4AF37',
            secondary: '#1F1F1F',
          },
        });
      }
    } catch (err) {
      toast.error('Failed to update wishlist', {
        style: {
          background: '#1F1F1F',
          color: '#fff',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
        },
      });
    }
  };

  const handleAddToCart = async (product, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const stockValue = Number(product?.stock);
    const isOutOfStock = product?.inStock === false || (Number.isFinite(stockValue) && stockValue <= 0);
    
    if (isOutOfStock) {
      toast.error('This item is out of stock', {
        style: {
          background: '#1F1F1F',
          color: '#fff',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
        },
      });
      return;
    }
    
    try {
      await addItem(product, 1);
      toast.success(`${product.name} added to cart!`, {
        style: {
          background: '#1F1F1F',
          color: '#fff',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
        },
        iconTheme: {
          primary: '#D4AF37',
          secondary: '#1F1F1F',
        },
      });
    } catch (err) {
      const message = err?.message || 'Failed to add to cart';
      toast.error(message, {
        style: {
          background: '#1F1F1F',
          color: '#fff',
          border: '1px solid #D4AF37',
          borderRadius: '8px',
        },
      });
    }
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white overflow-x-hidden pb-20 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: '#1F1F1F',
            color: '#fff',
            border: '1px solid #D4AF37',
            borderRadius: '8px',
          },
        }}
      />
      {/* Navigation Bar */}
      <motion.nav
        className="w-full bg-black border-b border-gray-800 sticky top-0 z-50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Brand Name */}
            <div className="flex items-center gap-2 md:gap-3">
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

            {/* Navigation Links - Desktop Only */}
            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                to="/"
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${
                  activeNavTab === 'Home'
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
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${
                  activeNavTab === 'Shop All'
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
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${
                  activeNavTab === 'Deals'
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
                className={`px-3 py-2 text-sm lg:text-base font-medium transition-all duration-300 relative ${
                  activeNavTab === 'Account'
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
            <motion.button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
              aria-label="Shopping Cart"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Page Header */}
      <motion.div
        className="w-full bg-black border-b border-gray-800 py-6 md:py-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center gap-3">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-center">
              {selectedCategory ? selectedCategory : 'All Products'}
            </h2>
            {selectedCategory ? (
              <div className="flex items-center gap-3">
                <p className="text-center text-gray-400">
                  Showing {products.length} {products.length === 1 ? 'product' : 'products'} in {selectedCategory}
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    navigate('/products');
                  }}
                  className="text-[#D4AF37] hover:text-[#F4D03F] text-sm font-medium underline transition-colors"
                >
                  Clear Filter
                </button>
              </div>
            ) : (
              <p className="text-center text-gray-400">
                Discover our complete collection
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Products Grid */}
      <motion.section
        className="w-full bg-black py-8 md:py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-400 text-lg mb-4">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="bg-[#D4AF37] hover:bg-[#F4D03F] text-black font-bold px-6 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              {products && products.length > 0 ? products.map((product, index) => {
                const productId = product._id || product.id;
                const inWishlist = isInWishlist(productId);
                const stockValue = Number(product?.stock);
                const isOutOfStock = product?.inStock === false || (Number.isFinite(stockValue) && stockValue <= 0);
                
                return (
                  <motion.div
                    key={productId || index}
                    variants={staggerItem}
                    whileHover={{ scale: 1.03, y: -5 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      to={`/product/${productId}`}
                      onClick={() => trackProductView(product)}
                      className="bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer group relative block"
                    >
                      {/* Product Image */}
                      <div className="relative h-36 md:h-48 lg:h-56 bg-gray-800 overflow-hidden">
                        <img
                          src={product.image || heroimg}
                          alt={product.name || 'Product'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            e.target.src = heroimg;
                          }}
                        />
                        
                        {/* Wishlist Heart Icon */}
                        <button
                          onClick={(e) => handleWishlistToggle(product, e)}
                          className="absolute top-3 right-3 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-70 transition-all duration-300 z-20"
                          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                        >
                          <svg
                            className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${
                              inWishlist
                                ? 'text-red-500 fill-red-500'
                                : 'text-white hover:text-red-400'
                            }`}
                            fill={inWishlist ? 'currentColor' : 'none'}
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                          </svg>
                        </button>
                      </div>

                      {/* Product Info */}
                      <div className="p-3 md:p-4 bg-gray-900">
                        {/* Name and Price in one row */}
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h4 className="text-sm md:text-base font-semibold text-white flex-1 truncate">
                            {product.name}
                          </h4>
                          <p className="text-xs md:text-sm font-bold text-white whitespace-nowrap">
                            {product.displayPrice}
                          </p>
                        </div>
                        
                        {/* Description */}
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2">
                          {product.description}
                        </p>
                        {isOutOfStock && (
                          <p className="text-xs font-semibold text-red-400 mb-1">Out of Stock</p>
                        )}
                        
                        {/* Add to Cart Button */}
                        <button 
                          onClick={(e) => handleAddToCart(product, e)}
                          disabled={isOutOfStock}
                          className={`w-full mt-2 font-bold px-2 py-1.5 rounded-lg text-[10px] md:text-xs transition-all duration-300 shadow-md ${
                            isOutOfStock
                              ? 'bg-gray-700 text-gray-300 cursor-not-allowed'
                              : 'bg-[#D4AF37] hover:bg-[#F4D03F] text-black hover:shadow-lg'
                          }`}
                        >
                          {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                    </Link>
                  </motion.div>
                );
              }) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-400 text-lg">No products found</p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.section>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNavbar />
    </motion.div>
  );
};

export default Products;

