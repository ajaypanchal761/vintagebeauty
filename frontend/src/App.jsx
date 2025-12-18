import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation, useNavigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Toaster } from 'react-hot-toast'
import Lenis from 'lenis'
import { useAuthStore } from './store/authStore'
import { setNavigate } from './utils/navigationHelper'
import Admin from './module/Admin/Admin'
import Home from './components/Home'
import Products from './components/Products'
import ProductDetail from './components/ProductDetail'
import Wishlist from './components/Wishlist'
import Account from './components/Account'
import Cart from './components/Cart'
import OrderSummary from './components/OrderSummary'
import Payment from './components/Payment'
import OrderSuccess from './components/OrderSuccess'
import Orders from './components/Orders'
import Addresses from './components/Addresses'
import Login from './components/Login'
import Signup from './components/Signup'
import FAQs from './components/FAQs'
import PrivacyPolicy from './components/PrivacyPolicy'
import TermsAndConditions from './components/TermsAndConditions'
import RefundPolicy from './components/RefundPolicy'
import AboutUs from './components/AboutUs'
import Deals from './components/Deals'
import ComboDeals from './components/ComboDeals'
import Support from './components/Support'
import MySupport from './components/MySupport'
import Notifications from './components/Notifications'
import NotificationListener from './components/NotificationListener'
import UserProtectedRoute from './components/UserProtectedRoute'
import Blogs from './components/Blogs'
import BlogDetail from './components/BlogDetail'
import TrackOrder from './components/TrackOrder'
import './App.css'

// Scroll to Top Component - Scrolls to top on route change
function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    // Small delay to ensure page has rendered and animations can start
    const timer = setTimeout(() => {
      // Try to use Lenis if available, otherwise use window.scrollTo
      const lenisInstance = window.lenis;
      if (lenisInstance && typeof lenisInstance.scrollTo === 'function') {
        lenisInstance.scrollTo(0, { immediate: false });
      } else {
        // Fallback to native scroll
        window.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return null;
}

// Smooth Scroll Setup Component
function SmoothScroll({ children }) {
  const location = useLocation();
  
  useEffect(() => {
    // Disable Lenis for admin routes to allow independent scrolling
    const isAdminRoute = location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      return; // Don't initialize Lenis for admin routes
    }
    
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    // Store lenis instance globally for ScrollToTop to use
    window.lenis = lenis;

    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
      delete window.lenis
    }
  }, [location.pathname])

  return <>{children}</>
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Set up navigation helper for use in API interceptor
  useEffect(() => {
    setNavigate(navigate);
    return () => {
      setNavigate(null);
    };
  }, [navigate]);
  
  return (
    <>
      <NotificationListener />
      <SmoothScroll>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/admin/*" element={<Admin />} />
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/account" element={<UserProtectedRoute><Account /></UserProtectedRoute>} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/order-summary" element={<UserProtectedRoute><OrderSummary /></UserProtectedRoute>} />
            <Route path="/payment" element={<UserProtectedRoute><Payment /></UserProtectedRoute>} />
            <Route path="/order-success" element={<UserProtectedRoute><OrderSuccess /></UserProtectedRoute>} />
            <Route path="/products/order-success" element={<UserProtectedRoute><OrderSuccess /></UserProtectedRoute>} />
            <Route path="/orders" element={<UserProtectedRoute><Orders /></UserProtectedRoute>} />
            <Route path="/addresses" element={<UserProtectedRoute><Addresses /></UserProtectedRoute>} />
            <Route path="/notifications" element={<UserProtectedRoute><Notifications /></UserProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/support" element={<Support />} />
            <Route path="/my-support" element={<UserProtectedRoute><MySupport /></UserProtectedRoute>} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/deals" element={<Deals />} />
            <Route path="/combo-deals/:id" element={<ComboDeals />} />
            <Route path="/blogs" element={<Blogs />} />
            <Route path="/blog/:slug" element={<BlogDetail />} />
            <Route path="/track-order" element={<TrackOrder />} />
          </Routes>
        </AnimatePresence>
      </SmoothScroll>
      <Toaster position="top-center" />
    </>
  );
}

function App() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}

export default App
