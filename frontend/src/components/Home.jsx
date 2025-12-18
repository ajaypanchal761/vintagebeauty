import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { products as productsService } from '../api';
import heroCarouselService from '../services/heroCarouselService';
import announcementService from '../services/announcementService';
import comboDealService from '../services/comboDealService';
import categoryService from '../services/categoryService';
import { useCartStore } from '../store/cartStore';
import BottomNavbar from './BottomNavbar';
import Footer from './Footer';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';
import toast from 'react-hot-toast';
import { trackCategoryVisit, trackAddToCart, trackProductView } from '../utils/activityTracker';

const Home = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount, addItem } = useCartStore();
  const [activeCategory, setActiveCategory] = useState('Perfume');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
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

  const categoryNames = ['Perfume', 'Room Spray', 'Pocket Perfume', 'After Shave', 'Gift Set'];
  
  // State for categories from API
  const [categoriesData, setCategoriesData] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  
  // State for products
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Cache for prefetched products by category
  const [productsCache, setProductsCache] = useState({});

  // State for promotional announcements
  const [promotionalAnnouncements, setPromotionalAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);

  // Get category image from API data - memoized for performance
  const getCategoryImage = useCallback((categoryName) => {
    if (!categoriesData || categoriesData.length === 0) {
      return heroimg; // Fallback to static image if categories not loaded
    }
    
    // Find category by name (case-insensitive)
    const category = categoriesData.find(cat => 
      cat.name?.toLowerCase() === categoryName.toLowerCase()
    );
    
    // Return category image if available, otherwise fallback
    return category?.image || heroimg;
  }, [categoriesData]);

  // Map category name to category slug/ID for API - memoized for performance
  const getCategorySlug = useCallback((categoryName) => {
    const categoryMap = {
      'Perfume': 'perfume',
      'Room Spray': 'room-spray',
      'Pocket Perfume': 'pocket-perfume',
      'After Shave': 'after-shave',
      'Gift Set': 'gift-set'
    };
    return categoryMap[categoryName] || 'perfume';
  }, []);

  // Process products data
  const processProducts = useCallback((productsArray) => {
    return productsArray.map((product) => {
      const image = product.images?.[0] || product.image || heroimg;
      const price = product.price 
        ? `₹${product.price}` 
        : (product.sizes?.[2]?.price 
          ? `₹${product.sizes[2].price}` 
          : '₹699');
      
      return {
        ...product,
        id: product._id || product.id,
        image,
        price,
        description: product.description || product.scentProfile || 'Premium product from Vintage Beauty',
      };
    });
  }, []);

  // Prefetch products for a category (for hover prefetching) with caching
  const prefetchCategoryProducts = useCallback(async (category) => {
    if (category === activeCategory) return; // Don't prefetch if already active
    if (productsCache[category]) return; // Already cached
    
    try {
      const categorySlug = getCategorySlug(category);
      const response = await productsService.getAll({
        category: categorySlug,
        limit: 8
      });
      
      const productsArray = response.products || response.data || [];
      if (response.success && productsArray.length > 0) {
        const processedProducts = processProducts(productsArray);
        // Cache the processed products
        setProductsCache(prev => ({
          ...prev,
          [category]: processedProducts
        }));
      }
    } catch (err) {
      // Silently fail prefetch - it's just for optimization
    }
  }, [activeCategory, getCategorySlug, productsCache, processProducts]);

  // No local data fallback - all data must come from database

  // Fetch products based on active category - ONLY from database
  useEffect(() => {
    const fetchProducts = async () => {
      // Check cache first - instant load if available
      if (productsCache[activeCategory]) {
        setProducts(productsCache[activeCategory]);
        setLoadingProducts(false);
        return;
      }
      
      setLoadingProducts(true);
      try {
        const categorySlug = getCategorySlug(activeCategory);
        
        // Use centralized API - products service
        const response = await productsService.getAll({
          category: categorySlug,
          limit: 8
        });
        
        // Get products array from response
        const productsArray = response.products || response.data || [];
        
        if (response.success && productsArray.length > 0) {
          const processedProducts = processProducts(productsArray);
          setProducts(processedProducts);
          
          // Cache the products for future use
          setProductsCache(prev => ({
            ...prev,
            [activeCategory]: processedProducts
          }));
        } else {
          setProducts([]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchProducts();
  }, [activeCategory, getCategorySlug, productsCache, processProducts]);

  // Fetch categories from API on mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await categoryService.getCategories();
        if (response.success && response.categories) {
          setCategoriesData(response.categories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        // Keep empty array on error - will use fallback images
        setCategoriesData([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Prefetch all other categories in background after initial load
  useEffect(() => {
    // Wait a bit after initial load, then prefetch other categories
    const timer = setTimeout(() => {
      categoryNames.forEach(category => {
        if (category !== activeCategory && !productsCache[category]) {
          prefetchCategoryProducts(category);
        }
      });
    }, 1000); // Start prefetching after 1 second

    return () => clearTimeout(timer);
  }, [activeCategory, categoryNames, productsCache, prefetchCategoryProducts]);

  // Fetch active promotional announcements for home page
  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoadingAnnouncements(true);
      try {
        const response = await announcementService.getActiveAnnouncements();
        if (response.success && response.data) {
          // Filter announcements that should be displayed on home page
          // displayLocation can be 'home', 'all', or array containing 'home'
          const homeAnnouncements = response.data.filter(announcement => {
            const displayLocation = announcement.displayLocation || [];
            return (
              displayLocation.includes('home') ||
              displayLocation.includes('all') ||
              (Array.isArray(displayLocation) && displayLocation.length === 0 && announcement.type === 'promotion')
            );
          });
          
          // Sort by priority (high > medium > low) and then by creation date
          const sortedAnnouncements = homeAnnouncements.sort((a, b) => {
            const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
            const priorityDiff = (priorityOrder[b.priority] || 2) - (priorityOrder[a.priority] || 2);
            if (priorityDiff !== 0) return priorityDiff;
            return new Date(b.createdAt) - new Date(a.createdAt);
          });
          
          setPromotionalAnnouncements(sortedAnnouncements);
        }
      } catch (error) {
        console.error('Error fetching announcements:', error);
        // Keep empty array on error - will use fallback
        setPromotionalAnnouncements([]);
      } finally {
        setLoadingAnnouncements(false);
      }
    };

    fetchAnnouncements();
  }, []);

  // Track views for announcements when they are displayed (once per session)
  useEffect(() => {
    if (promotionalAnnouncements.length === 0) return;

    const trackViews = async () => {
      const viewedKey = 'announcement_views_tracked';
      const viewedIds = JSON.parse(sessionStorage.getItem(viewedKey) || '[]');

      for (const announcement of promotionalAnnouncements) {
        const announcementId = announcement._id || announcement.id;
        if (!announcementId) continue;

        // Only track if not already viewed in this session
        if (!viewedIds.includes(announcementId)) {
          try {
            await announcementService.incrementViews(announcementId);
            viewedIds.push(announcementId);
          } catch (error) {
            console.error(`Error tracking view for announcement ${announcementId}:`, error);
            // Continue tracking other announcements even if one fails
          }
        }
      }

      // Update sessionStorage with tracked IDs
      sessionStorage.setItem(viewedKey, JSON.stringify(viewedIds));
    };

    // Small delay to ensure announcements are rendered
    const timer = setTimeout(trackViews, 500);
    return () => clearTimeout(timer);
  }, [promotionalAnnouncements]);

  // Banner Carousel Component
  const BannerCarousel = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [bannerSlides, setBannerSlides] = useState([]);
    const [loadingBanner, setLoadingBanner] = useState(true);

    // No fallback slides - only use data from API

    // Fetch banner carousel from API
    useEffect(() => {
      const fetchBannerCarousel = async () => {
        setLoadingBanner(true);
        try {
          const response = await heroCarouselService.getCarouselItems(true); // Get only active items
          if (response.success && response.data && response.data.length > 0) {
            // Map API response to banner format
            const mappedSlides = response.data.map((item, index) => ({
              id: item._id || item.id || index + 1,
              title: item.title || `Banner ${index + 1}`,
              tagline: item.title || item.headline || '', // Use title as tagline (main headline)
              subtitle: item.subtitle || item.description || '',
              badge: item.badge || item.label || 'FEATURED',
              image: item.image || heroimg, // API returns image URL directly
              brand: item.brand || 'VINTAGE BEAUTY',
              link: item.link || '/products',
              buttonText: item.buttonText || 'SHOP NOW',
              order: item.order !== undefined ? item.order : index
            })).sort((a, b) => (a.order || 0) - (b.order || 0));
            
            setBannerSlides(mappedSlides);
          } else {
            // No fallback - use empty array if API returns empty
            setBannerSlides([]);
          }
        } catch (error) {
          console.error('Error fetching banner carousel:', error);
          // No fallback - use empty array on error
          setBannerSlides([]);
        } finally {
          setLoadingBanner(false);
        }
      };

      fetchBannerCarousel();
    }, []);

    useEffect(() => {
      if (bannerSlides.length === 0) return;
      
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
      }, 5000); // Change slide every 5 seconds

      return () => clearInterval(interval);
    }, [bannerSlides.length]);

    const goToSlide = (index) => {
      setCurrentSlide(index);
    };

    // Show loading state
    if (loadingBanner || bannerSlides.length === 0) {
      return (
        <div className="relative w-full h-[180px] md:h-[240px] lg:h-[300px] rounded-2xl overflow-hidden bg-gray-900 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
        </div>
      );
    }

    const currentBanner = bannerSlides[currentSlide];

    return (
      <div className="relative w-full h-[180px] md:h-[240px] lg:h-[300px] rounded-2xl overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <motion.img
            key={currentSlide}
            src={currentBanner.image}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 1 }}
            onError={(e) => {
              // Fallback to heroimg if image fails to load
              if (e.target.src !== heroimg) {
                e.target.src = heroimg;
              }
            }}
          />
          {/* Dark overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-transparent"></div>
          {/* Moonlit effect overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-transparent to-amber-900/20"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col justify-center gap-3 md:gap-4 px-5 md:px-10 lg:px-14 py-6 md:py-8">
          {/* Top Badge */}
          <motion.div
            className="self-start"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-4 py-2 rounded-lg border-2 border-black shadow-lg">
              <span className="text-xs md:text-sm font-bold uppercase tracking-wider">{currentBanner.badge}</span>
            </div>
          </motion.div>

          {/* Main Content - Left Side */}
          <div className="flex flex-col justify-center max-w-xl md:max-w-2xl">
            <motion.h2
              className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2 md:mb-3 leading-tight"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {currentBanner.tagline}
            </motion.h2>
            <motion.p
              className="text-sm md:text-lg lg:text-xl text-[#D4AF37] font-semibold mb-3 md:mb-4 max-w-md"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {currentBanner.subtitle}
            </motion.p>
            <motion.button
              onClick={() => navigate(currentBanner.link || '/products')}
              className="bg-black/80 border border-white/70 text-white px-5 md:px-7 py-2.5 md:py-3 rounded-full text-xs md:text-sm lg:text-base font-semibold tracking-wide hover:bg-white hover:text-black transition-all duration-300 w-fit shadow-lg shadow-black/40"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {currentBanner.buttonText || 'SHOP NOW'}
            </motion.button>
          </div>

          {/* Slide Indicators */}
          <div className="flex gap-2 justify-start md:justify-center mt-2 md:mt-4">
            {bannerSlides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? 'w-8 bg-[#D4AF37]'
                    : 'w-2 bg-white/50 hover:bg-white/75'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Decorative Golden Arch Elements */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-32 md:w-48 lg:w-64 h-full opacity-20 pointer-events-none">
          <div className="h-full w-full flex items-center justify-end">
            <div className="w-24 md:w-36 lg:w-48 h-3/4 border-l-2 border-t-2 border-b-2 border-[#D4AF37] rounded-l-full"></div>
          </div>
        </div>
      </div>
    );
  };

  // Deal Cards Section Component
  const DealCardsSection = () => {
    const [dealCards, setDealCards] = useState([]);
    const [loadingDeals, setLoadingDeals] = useState(true);

    useEffect(() => {
      const fetchDeals = async () => {
        try {
          setLoadingDeals(true);
          const response = await comboDealService.getComboDeals();
          const deals = (response.data || []).map(deal => ({
            id: deal._id,
            dealHighlight: deal.dealHighlight,
            title: deal.title,
            description: deal.description,
            currentPrice: `₹${deal.currentPrice}`,
            originalPrice: `₹${deal.originalPrice}`,
            discount: deal.discount || '',
            image: deal.image,
            link: `/combo-deals/${deal._id}`
          }));
          setDealCards(deals);
        } catch (error) {
          console.error('Error fetching combo deals:', error);
          // No fallback - use empty array if API fails
          setDealCards([]);
        } finally {
          setLoadingDeals(false);
        }
      };

      fetchDeals();
    }, []);

    return (
      <div className="w-full">
        {/* Section Header */}
        <div className="text-center mb-6 md:mb-8">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">
            Exclusive <span className="text-[#D4AF37]">Deals</span>
          </h2>
          <p className="text-gray-400 text-sm md:text-base">Choose your perfect combo and save more</p>
        </div>

        {/* Deal Cards Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto">
          {dealCards.map((card) => (
            <motion.div
              key={card.id}
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden relative p-3 md:p-4 shadow-lg border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all duration-300 hover:shadow-2xl"
              whileHover={{ scale: 1.02, y: -5 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Link to={card.link} className="flex flex-col items-center text-center">
                {/* Deal Highlight */}
                <div className="mb-2 md:mb-3">
                  <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold leading-tight">{card.dealHighlight}</p>
                </div>
                
                {/* Product Image Container with Golden Pedestal */}
                <div className="relative mb-2 md:mb-3 w-full flex items-center justify-center">
                  <div className="relative w-20 h-20 md:w-28 md:h-28">
                    {/* Golden base circle */}
                    <div className="absolute inset-2 md:inset-3 bg-gradient-to-br from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] rounded-full shadow-lg"></div>
                    {/* Products on pedestal */}
                    <div className="absolute inset-2 overflow-hidden rounded-full">
                      <img 
                        src={card.image} 
                        alt={card.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Title */}
                <h3 className="text-xs md:text-sm font-bold text-white mb-0.5">{card.title}</h3>
                
                {/* Description */}
                <p className="text-[10px] md:text-xs text-gray-400 mb-2">{card.description}</p>
                
                {/* Pricing */}
                <div className="mb-2 md:mb-3">
                  <div className="flex items-baseline justify-center gap-1.5">
                    <span className="text-sm md:text-base font-bold text-[#D4AF37]">{card.currentPrice}</span>
                    <span className="text-[10px] md:text-xs text-gray-500 line-through">{card.originalPrice}</span>
                    <span className="text-[10px] md:text-xs text-green-400 font-semibold">{card.discount}</span>
                  </div>
                </div>
                
                {/* Build Your Box Button */}
                <div className="w-full border-2 border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black px-3 py-1.5 md:py-2 rounded-md text-[10px] md:text-xs font-semibold transition-all duration-300 text-center">
                  Build Your Box
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  const buttonVariants = {
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: "easeInOut",
      },
    },
    tap: {
      scale: 0.95,
    },
  };

  return (
    <motion.div
      className="min-h-screen bg-black text-white overflow-x-hidden md:overflow-x-visible pb-20 md:pb-0"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Navigation Bar */}
      <motion.nav
        className="w-full bg-black border-b border-gray-800"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Hamburger Menu */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Menu"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo/Brand Name */}
            <div className="flex items-center gap-2 md:gap-3">
              {logo && (
                <img 
                  src={logo} 
                  alt="THE PERFUME Logo" 
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

      {/* Category Images Carousel */}
      <motion.div
        className="w-full bg-black py-4 md:py-6 overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="relative">
          {/* Mobile: Continuous Scrolling Carousel */}
          <div className="md:hidden overflow-hidden">
            <div className="flex animate-scroll-horizontal">
              {[...Array(2)].map((_, repeatIndex) => (
                <div key={repeatIndex} className="flex items-center gap-4 px-4">
                  {categoryNames.map((category, index) => {
                    // Use category image from database, fallback to heroimg
                    const categoryImage = getCategoryImage(category);

                    return (
                      <Link
                        key={`${category}-${repeatIndex}-${index}`}
                        to={`/products?category=${category.toLowerCase().replace(' ', '-')}`}
                        className="flex flex-col items-center gap-2 min-w-[100px]"
                      >
                        <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 hover:border-[#D4AF37] transition-all duration-300">
                          <img
                            src={categoryImage}
                            alt={category}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (e.target.src !== heroimg) {
                                e.target.src = heroimg;
                              }
                            }}
                          />
                        </div>
                        <span className="text-xs text-white text-center font-medium">{category}</span>
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop: Static Grid */}
          <div className="hidden md:flex items-center justify-center gap-6 lg:gap-8 px-4 md:px-6">
            {categoryNames.map((category, index) => {
              // Use category image from database, fallback to heroimg
              const categoryImage = getCategoryImage(category);

              return (
                <Link
                  key={category}
                  to={`/products?category=${category.toLowerCase().replace(' ', '-')}`}
                  className="flex flex-col items-center gap-3 group"
                >
                  <motion.div
                    className="w-24 h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden bg-gray-800 border-2 border-gray-700 group-hover:border-[#D4AF37] transition-all duration-300 shadow-lg"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <img
                      src={categoryImage}
                      alt={category}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        if (e.target.src !== heroimg) {
                          e.target.src = heroimg;
                        }
                      }}
                    />
                  </motion.div>
                  <span className="text-sm lg:text-base text-white text-center font-medium group-hover:text-[#D4AF37] transition-colors">
                    {category}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Category Navigation */}
      <motion.div
        className="w-full bg-black overflow-x-auto scrollbar-hide"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center gap-6 md:gap-8 py-3 md:py-4 min-w-max md:min-w-0">
            {categoryNames.map((category, index) => (
              <motion.button
                key={category}
                onClick={() => {
                  setActiveCategory(category);
                  
                  // Track category visit
                  trackCategoryVisit(category);
                  
                  // If cached, show immediately
                  if (productsCache[category]) {
                    setProducts(productsCache[category]);
                    setLoadingProducts(false);
                  }
                  // Scroll to products section
                  setTimeout(() => {
                    const productsSection = document.getElementById('products-section');
                    if (productsSection) {
                      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 50);
                }}
                onMouseEnter={() => {
                  // Aggressive prefetch on hover - start immediately
                  prefetchCategoryProducts(category);
                }}
                className={`text-sm md:text-base font-medium whitespace-nowrap transition-colors pb-2 border-b-2 ${
                  activeCategory === category
                    ? 'text-white border-[#D4AF37] font-semibold'
                    : 'text-white border-transparent hover:text-[#D4AF37]'
                }`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * index }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Promotional Banner - Dynamic from API */}
      {!loadingAnnouncements && (
        <motion.div
          className="w-full bg-gradient-to-r from-[#D4AF37]/10 via-[#D4AF37]/20 to-[#D4AF37]/10 border-y border-[#D4AF37]/30 relative overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex items-center justify-between gap-3 md:gap-6 py-4 md:py-5">
              {/* Left Side - First Announcement or Fallback */}
              {promotionalAnnouncements.length > 0 ? (
                <div 
                  className={`flex items-center gap-2 md:gap-3 flex-1 ${promotionalAnnouncements[0].link?.url ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={async () => {
                    const announcement = promotionalAnnouncements[0];
                    const announcementId = announcement._id || announcement.id;
                    
                    // Track click
                    if (announcementId) {
                      try {
                        await announcementService.incrementClicks(announcementId);
                      } catch (error) {
                        console.error(`Error tracking click for announcement ${announcementId}:`, error);
                      }
                    }
                    
                    // Navigate to link if available
                    if (announcement.link?.url) {
                      if (announcement.link.url.startsWith('http://') || announcement.link.url.startsWith('https://')) {
                        window.open(announcement.link.url, '_blank');
                      } else {
                        navigate(announcement.link.url);
                      }
                    }
                  }}
                >
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-sm md:text-base font-semibold text-white">
                      {promotionalAnnouncements[0].title || promotionalAnnouncements[0].content?.split('•')[0]?.trim() || 'FREE SHIPPING'}
                    </span>
                    {promotionalAnnouncements[0].content && promotionalAnnouncements[0].content.includes('•') && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">
                          {promotionalAnnouncements[0].content.split('•')[1]?.trim() || promotionalAnnouncements[0].content.split('•')[0]?.trim() || 'On orders above ₹999'}
                        </span>
                      </>
                    )}
                    {!promotionalAnnouncements[0].content?.includes('•') && promotionalAnnouncements[0].content && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">{promotionalAnnouncements[0].content}</span>
                      </>
                    )}
                    {!promotionalAnnouncements[0].content && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">On orders above ₹999</span>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                // Fallback - Default FREE SHIPPING
                <div className="flex items-center gap-2 md:gap-3 flex-1">
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                    <span className="text-sm md:text-base font-semibold text-white">FREE SHIPPING</span>
                    <span className="hidden md:block text-[#D4AF37]">•</span>
                    <span className="text-xs md:text-sm text-gray-300">On orders above ₹999</span>
                  </div>
                </div>
              )}

              {/* Center - Model Image */}
              <div className="hidden md:flex items-center justify-center flex-shrink-0">
                <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-2 border-[#D4AF37]/40 shadow-lg bg-gray-800">
                  <img 
                    src={heroimg} 
                    alt="Vintage Beauty"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Right Side - Second Announcement or Fallback */}
              {promotionalAnnouncements.length > 1 ? (
                <div 
                  className={`flex items-center gap-2 md:gap-3 flex-1 justify-end ${promotionalAnnouncements[1].link?.url ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                  onClick={async () => {
                    const announcement = promotionalAnnouncements[1];
                    const announcementId = announcement._id || announcement.id;
                    
                    // Track click
                    if (announcementId) {
                      try {
                        await announcementService.incrementClicks(announcementId);
                      } catch (error) {
                        console.error(`Error tracking click for announcement ${announcementId}:`, error);
                      }
                    }
                    
                    // Navigate to link if available
                    if (announcement.link?.url) {
                      if (announcement.link.url.startsWith('http://') || announcement.link.url.startsWith('https://')) {
                        window.open(announcement.link.url, '_blank');
                      } else {
                        navigate(announcement.link.url);
                      }
                    }
                  }}
                >
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-right">
                    <span className="text-sm md:text-base font-semibold text-white">
                      {promotionalAnnouncements[1].title || promotionalAnnouncements[1].content?.split('•')[0]?.trim() || 'FLAT 5% OFF'}
                    </span>
                    {promotionalAnnouncements[1].content && promotionalAnnouncements[1].content.includes('•') && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">
                          {promotionalAnnouncements[1].content.split('•')[1]?.trim() || promotionalAnnouncements[1].content.split('•')[0]?.trim() || 'On Prepaid Orders'}
                        </span>
                      </>
                    )}
                    {!promotionalAnnouncements[1].content?.includes('•') && promotionalAnnouncements[1].content && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">{promotionalAnnouncements[1].content}</span>
                      </>
                    )}
                    {!promotionalAnnouncements[1].content && (
                      <>
                        <span className="hidden md:block text-[#D4AF37]">•</span>
                        <span className="text-xs md:text-sm text-gray-300">On Prepaid Orders</span>
                      </>
                    )}
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              ) : promotionalAnnouncements.length === 1 ? (
                // If only one announcement, show it on right side too or show fallback
                <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-right">
                    <span className="text-sm md:text-base font-semibold text-white">FLAT 5% OFF</span>
                    <span className="hidden md:block text-[#D4AF37]">•</span>
                    <span className="text-xs md:text-sm text-gray-300">On Prepaid Orders</span>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              ) : (
                // Fallback - Default FLAT 5% OFF
                <div className="flex items-center gap-2 md:gap-3 flex-1 justify-end">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 text-right">
                    <span className="text-sm md:text-base font-semibold text-white">FLAT 5% OFF</span>
                    <span className="hidden md:block text-[#D4AF37]">•</span>
                    <span className="text-xs md:text-sm text-gray-300">On Prepaid Orders</span>
                  </div>
                  <div className="flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          </div>
          {/* Decorative Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundRepeat: 'repeat'
            }}></div>
          </div>
        </motion.div>
      )}

      {/* Hero Section - Cosmetic Body Spray */}
      <motion.section
        className="w-full bg-black py-6 md:py-10 lg:py-12 min-h-[250px] md:min-h-[350px] lg:min-h-[450px] flex items-center relative overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div className="container mx-auto px-4 md:px-6 w-full relative">
          <div className="flex flex-row items-center justify-between gap-3 md:gap-6 w-full relative">
            {/* Left Content */}
            <motion.div
              className="flex-[1.5] md:flex-[1.8] text-left flex flex-col justify-center relative z-10"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              <motion.h2
                className="text-xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 md:mb-4 lg:mb-5 leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <span className="text-white">Cosmetic </span>
                <span className="text-[#D4AF37]">
                  <span className="font-bold">Body</span> Spray
                </span>
              </motion.h2>
              <motion.p
                className="text-sm md:text-base lg:text-lg text-white mb-4 md:mb-5 lg:mb-6 max-w-xl md:max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                Energetic aromatic Fougere fragrance for all the ways you play.
              </motion.p>
              <motion.button
                onClick={() => navigate('/products')}
                className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 hover:from-gray-800 hover:via-gray-700 hover:to-gray-800 text-white px-6 md:px-8 py-2.5 md:py-3 lg:py-3.5 rounded-lg text-sm md:text-base lg:text-lg font-medium transition-all duration-300 shadow-lg hover:shadow-xl flex items-center gap-2 border border-gray-700 w-fit"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.8 }}
                whileHover={{ scale: 1.05, boxShadow: "0 10px 25px rgba(212, 175, 55, 0.3)" }}
                whileTap={{ scale: 0.95 }}
              >
                Shop Now
                <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </motion.button>
            </motion.div>

            {/* Right Image */}
            <motion.div
              className="flex-1 flex justify-end mr-0 md:mr-4 items-center h-full relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="relative h-full flex items-center">
                <motion.img
                  src={heroimg}
                  alt="Cosmetic Body Spray"
                  className="absolute -right-26 max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl h-[300px] md:h-[450px] lg:h-[550px] object-contain drop-shadow-2xl z-0"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: 0.8, ease: "easeOut" }}
                  whileHover={{ scale: 1.05 }}
                />
              </div>
            </motion.div>
            </div>
          </div>
      </motion.section>

      {/* Banner Carousel - Direct, with subtle spacing from hero image */}
      <div className="w-full bg-black pt-2 md:pt-3 pb-4 md:pb-6 mt-4 md:mt-6">
        <div className="container mx-auto px-4 md:px-6">
          <BannerCarousel />
        </div>
      </div>

      {/* Deal Cards Section */}
      <motion.section
        className="w-full bg-black py-8 md:py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.7 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          <DealCardsSection />
        </div>
      </motion.section>

      {/* Dynamic Products Section */}
      <motion.section
        id="products-section"
        className="w-full bg-black py-6 md:py-12"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="container mx-auto px-4 md:px-6">
          {/* Section Header */}
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold text-white">
              {activeCategory === 'Perfume' ? 'Dynamic Perfume' : activeCategory}
            </h3>
            <button className="text-[#D4AF37] hover:text-[#F4D03F] transition-colors">
              <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Product Cards - Horizontal Scroll */}
          <div className="overflow-x-auto pb-4 md:pb-6 scrollbar-hide">
            <motion.div
              className="flex gap-3 md:gap-4"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {loadingProducts && products.length === 0 ? (
                // Skeleton Loaders for better perceived performance - show fewer for faster perceived load
                [...Array(3)].map((_, index) => (
                  <div
                    key={`skeleton-${index}`}
                    className="flex-shrink-0 w-36 md:w-48 lg:w-56 bg-gray-900 rounded-xl overflow-hidden border border-gray-800"
                    style={{ minHeight: '280px' }}
                  >
                    <div className="h-36 md:h-48 lg:h-56 bg-gray-800 animate-pulse"></div>
                    <div className="p-3 md:p-4 space-y-2">
                      <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-800 rounded w-2/3 animate-pulse"></div>
                      <div className="h-3 bg-gray-800 rounded w-1/2 animate-pulse"></div>
                    </div>
                  </div>
                ))
              ) : products.length > 0 ? (
                products.map((product, index) => {
                  const productId = product._id || product.id;
                  const productName = product.name || 'Unnamed Product';
                  const productPrice = product.price || '₹699';
                  const productDescription = product.description || product.scentProfile || 'Premium product from Vintage Beauty';
                  const productImage = product.image || heroimg;
                  const stockValue = Number(product?.stock);
                  const isOutOfStock = product?.inStock === false || (Number.isFinite(stockValue) && stockValue <= 0);
                  
                  return (
                    <motion.div
                      key={productId}
                      variants={itemVariants}
                      whileHover={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        to={`/product/${productId}`}
                        onClick={() => trackProductView(product)}
                        className="flex-shrink-0 w-36 md:w-48 lg:w-56 bg-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer block border border-gray-800 hover:border-[#D4AF37]/50 relative"
                        style={{ minHeight: '280px' }}
                      >
                        {/* Product Image */}
                        <div className="relative h-36 md:h-48 lg:h-56 bg-gray-800 overflow-hidden">
                          <img
                            src={productImage}
                            alt={productName}
                            className="w-full h-full object-cover transition-opacity duration-300"
                            onError={(e) => {
                              if (e.target.src !== heroimg) {
                                e.target.src = heroimg;
                              }
                            }}
                            loading={index < 2 ? "eager" : "lazy"}
                            decoding="async"
                          />
                        </div>

                        {/* Product Info */}
                        <div className="p-3 md:p-4 bg-gray-900 relative z-10">
                          {/* Name and Price in one row */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <h4 className="text-sm md:text-base font-semibold text-white flex-1 truncate" title={productName}>
                              {productName}
                            </h4>
                            <p className="text-xs md:text-sm font-bold text-[#D4AF37] whitespace-nowrap">
                              {productPrice}
                            </p>
                          </div>
                          {/* Description */}
                          <p className="text-xs text-gray-400 line-clamp-2 mb-2" title={productDescription}>
                            {productDescription}
                          </p>
                          {isOutOfStock && (
                            <p className="text-xs font-semibold text-red-400 mb-1">Out of Stock</p>
                          )}
                          {/* Add to Cart Button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
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
                                addItem(product, 1);
                                toast.success(`${productName} added to cart!`, {
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
                              } catch (error) {
                            const message = error?.message || 'Failed to add to cart';
                            toast.error(message);
                              }
                            }}
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
                })
              ) : (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-400">No products found in this category</p>
                </div>
              )}
            </motion.div>
            </div>
          </div>
      </motion.section>

      {/* Sidebar Menu - Sliding from left */}
      <div className={`fixed left-0 top-0 h-full w-80 bg-black z-[9999] shadow-2xl transition-transform duration-500 ease-in-out ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col border-r border-gray-800`}>
        <div className="overflow-y-auto flex-1">
          {/* Close Button */}
          <div className="flex justify-end p-4 border-b border-gray-800">
              <button
                onClick={() => setIsMenuOpen(false)}
              className="text-white hover:text-[#D4AF37] transition-colors p-2"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

          {/* Top Section - MY ORDERS & TRACK ORDER Buttons */}
          <div className="px-4 pt-4 pb-4">
            <div className="flex gap-2 mb-4">
              <button 
                onClick={() => {
                  navigate('/orders');
                  setIsMenuOpen(false);
                }}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span className="text-sm font-bold text-white">MY ORDERS</span>
              </button>
              <button 
                onClick={() => {
                  navigate('/track-order');
                  setIsMenuOpen(false);
                }}
                className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg hover:bg-gray-800 transition cursor-pointer"
              >
                <svg className="w-5 h-5 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <span className="text-sm font-bold text-white">TRACK ORDER</span>
              </button>
            </div>

            {/* Category Shortcuts - Circular Icons */}
            <div className="flex gap-3 justify-center">
              {/* PERFUMES */}
              <button 
                onClick={() => {
                  setActiveCategory('Perfume');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center overflow-hidden shadow-md border-2 border-[#D4AF37]">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white mt-1">PERFUMES</span>
                <span className="text-[10px] text-gray-400">VINTAGE BEAUTY</span>
              </button>

              {/* ROOM SPRAY */}
              <button 
                onClick={() => {
                  setActiveCategory('Room Spray');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-gray-600 flex items-center justify-center overflow-hidden shadow-md">
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white mt-1">ROOM SPRAY</span>
                <span className="text-[10px] text-gray-400">VINTAGE BEAUTY</span>
              </button>

              {/* GIFT SET */}
              <button 
                onClick={() => {
                  setActiveCategory('Gift Set');
                  setIsMenuOpen(false);
                }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-[#D4AF37] flex items-center justify-center overflow-hidden shadow-md">
                  <svg className="w-8 h-8 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-white mt-1">GIFT SET</span>
              </button>
            </div>
          </div>

          {/* Main Menu List */}
          <div className="bg-black pb-4">
            {/* SHOP ALL */}
            <Link 
              to="/products"
              onClick={() => {
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">SHOP ALL</span>
            </Link>

            {/* CATEGORIES */}
            <div>
              <button 
                onClick={() => {
                  setActiveCategory('Perfume');
                  setIsMenuOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
              >
                <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className="flex-1 text-left text-sm font-semibold text-white">CATEGORIES</span>
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* PERFUMES */}
            <button 
              onClick={() => {
                setActiveCategory('Perfume');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">PERFUMES</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* ROOM SPRAY */}
            <button 
              onClick={() => {
                setActiveCategory('Room Spray');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">ROOM SPRAY</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* POCKET PERFUME */}
            <button 
              onClick={() => {
                setActiveCategory('Pocket Perfume');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">POCKET PERFUME</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* AFTER SHAVE */}
            <button 
              onClick={() => {
                setActiveCategory('After Shave');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">AFTER SHAVE</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* GIFT SET */}
            <button 
              onClick={() => {
                setActiveCategory('Gift Set');
                setIsMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-900 transition"
            >
              <svg className="w-6 h-6 text-[#D4AF37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
              <span className="flex-1 text-left text-sm font-semibold text-white">GIFT SET</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </div>
        </div>

      {/* Overlay - Only on mobile */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-[9998] md:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Footer */}
      <Footer />

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNavbar />
    </motion.div>
  );
};

export default Home;

