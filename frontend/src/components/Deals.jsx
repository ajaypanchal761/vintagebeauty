import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCartStore } from '../store/cartStore';
import BottomNavbar from './BottomNavbar';
import comboDealService from '../services/comboDealService';
import logo from '../assets/logo vintage.png';
import heroimg from '../assets/heroimg.png';

const Deals = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { getItemCount } = useCartStore();
  const [currentOffer, setCurrentOffer] = useState(0);
  const cartItemCount = getItemCount();

  // Get active navigation tab
  const getActiveNavTab = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname === '/products' || location.pathname.startsWith('/shop')) return 'Shop All';
    if (location.pathname === '/deals' || location.pathname.startsWith('/combo-deals')) return 'Deals';
    if (location.pathname === '/account') return 'Account';
    return '';
  };

  const activeNavTab = getActiveNavTab();

  // Promotional offers for top banner
  const offers = [
    "Buy 3 Perfumes, Get 1 Free!",
    "FLAT 5% OFF ON ALL PREPAID ORDERS",
    "FREE SHIPPING ON ORDERS ABOVE ₹999"
  ];

  // Bundle cards data
  const [bundleCards, setBundleCards] = useState([]);
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
          requiredItems: deal.requiredItems,
          freeItems: deal.freeItems
        }));
        setBundleCards(deals);
      } catch (error) {
        console.error('Error fetching combo deals:', error);
        // Fallback to default deals if API fails
        setBundleCards([
          {
            id: 1,
            dealHighlight: "Buy Any 3 for ₹1,298 Only",
            title: "Ultimate Perfume Box",
            description: "Buy any 3 perfumes, get 1 free",
            currentPrice: "₹1,298",
            originalPrice: "₹2,997",
            discount: "↓57%",
            image: heroimg,
            requiredItems: 3,
            freeItems: 1
          },
          {
            id: 2,
            dealHighlight: "Buy Any 4 for ₹1,798 Only",
            title: "The Self Love Kit",
            description: "Buy any 4 products, get 1 free",
            currentPrice: "₹1,798",
            originalPrice: "₹2,796",
            discount: "↓36%",
            image: heroimg,
            requiredItems: 4,
            freeItems: 1
          },
          {
            id: 3,
            dealHighlight: "Buy Any 5 for ₹2,298 Only",
            title: "Scent Shower Combo",
            description: "Buy any 5 products, get 1 free",
            currentPrice: "₹2,298",
            originalPrice: "₹3,495",
            discount: "↓34%",
            image: heroimg,
            requiredItems: 5,
            freeItems: 1
          },
          {
            id: 4,
            dealHighlight: "Buy Any 6 for ₹2,598 Only",
            title: "Premium Collection Box",
            description: "Buy any 6 products, get 1 free",
            currentPrice: "₹2,598",
            originalPrice: "₹4,194",
            discount: "↓38%",
            image: heroimg,
            requiredItems: 6,
            freeItems: 1
          }
        ]);
      } finally {
        setLoadingDeals(false);
      }
    };

    fetchDeals();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white overflow-x-hidden pb-20 md:pb-0">
      {/* Navigation Bar */}
      <nav className="w-full bg-black border-b border-gray-800 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors"
              aria-label="Back"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

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
            <button
              onClick={() => navigate('/cart')}
              className="p-2 hover:bg-gray-900 rounded-lg transition-colors relative"
              aria-label="Shopping Cart"
            >
              <svg className="w-6 h-6 md:w-7 md:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#D4AF37] text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount > 9 ? '9+' : cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Top Promotional Banner */}
      <div className="bg-black text-white py-3 md:py-4 relative overflow-hidden border-b border-[#D4AF37]/20">
        <div className="flex items-center justify-center relative min-h-[40px]">
          <button 
            onClick={() => setCurrentOffer((prev) => (prev === 0 ? offers.length - 1 : prev - 1))}
            className="absolute left-2 md:left-4 z-10 p-1.5 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-400 hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="text-xs md:text-sm font-medium text-center px-10 md:px-16 w-full max-w-full flex items-center justify-center text-[#D4AF37]">
            {offers[currentOffer]}
          </div>
          
          <button 
            onClick={() => setCurrentOffer((prev) => (prev === offers.length - 1 ? 0 : prev + 1))}
            className="absolute right-2 md:right-4 z-10 p-1.5 flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-gray-400 hover:text-[#D4AF37] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Deals Content */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Section Heading */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2">Combo Deals</h1>
          <p className="text-sm md:text-base text-gray-400">Build your own box and save more!</p>
        </div>

        {/* Bundle Cards Grid */}
        {loadingDeals ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 md:gap-4 lg:gap-6 max-w-5xl mx-auto">
            {bundleCards.map((card) => (
            <div 
              key={card.id} 
              className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl overflow-hidden relative p-3 md:p-4 shadow-lg border border-[#D4AF37]/20 hover:border-[#D4AF37]/40 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="flex flex-col items-center text-center">
                {/* Deal Highlight */}
                <div className="mb-2 md:mb-3">
                  <p className="text-[10px] md:text-xs text-[#D4AF37] font-bold leading-tight">{card.dealHighlight}</p>
                </div>
                
                {/* Product Image Container with Golden Pedestal */}
                <div className="relative mb-2 md:mb-3 w-full flex items-center justify-center">
                  {/* Golden Circular Pedestal */}
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
                <Link 
                  to={`/combo-deals/${card.id}`}
                  className="w-full border-2 border-[#D4AF37] text-[#D4AF37] bg-transparent hover:bg-[#D4AF37] hover:text-black px-3 py-1.5 md:py-2 rounded-md text-[10px] md:text-xs font-semibold transition-all duration-300 block text-center"
                >
                  Build Your Box
                </Link>
              </div>
            </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Navigation Bar - Mobile Only */}
      <BottomNavbar />
    </div>
  );
};

export default Deals;

