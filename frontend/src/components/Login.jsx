import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import authService from '../services/authService';
import toast from 'react-hot-toast';
import BottomNavbar from './BottomNavbar';
import logo from '../assets/logo vintage.png';
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email.trim()) {
      toast.error('Please enter your email');
      return;
    }
    
    if (!formData.password) {
      toast.error('Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);
      if (response.success && response.data.token) {
        const { user, token } = response.data;
        
        // Trim token to ensure no whitespace
        const cleanToken = String(token).trim();
        
        if (!cleanToken || cleanToken.length < 10) {
          console.error('Invalid token received from server');
          toast.error('Invalid authentication token. Please try again.');
          setIsLoading(false);
          return;
        }
        
        // Store token and user data synchronously before navigation
        login(user, cleanToken);
        
        // CRITICAL: Verify token is stored correctly before navigating
        // Check multiple times to ensure storage is complete
        let verificationAttempts = 0;
        const maxVerificationAttempts = 10;
        let tokenVerified = false;
        
        while (verificationAttempts < maxVerificationAttempts && !tokenVerified) {
          await new Promise(resolve => setTimeout(resolve, 50));
          const storedToken = localStorage.getItem('token');
          
          if (storedToken && storedToken.trim() === cleanToken) {
            tokenVerified = true;
            break;
          }
          verificationAttempts++;
        }
        
        if (!tokenVerified) {
          const storedToken = localStorage.getItem('token');
          console.error('Token storage verification failed after multiple attempts', { 
            stored: storedToken, 
            expected: cleanToken,
            attempts: verificationAttempts
          });
          toast.error('Failed to store authentication. Please try again.');
          setIsLoading(false);
          return;
        }
        
        // Verify loginTimestamp is stored
        const loginTimestamp = localStorage.getItem('loginTimestamp');
        if (!loginTimestamp) {
          console.warn('Login timestamp not stored, storing now');
          localStorage.setItem('loginTimestamp', Date.now().toString());
        }
        
        // Verify auth-storage is also updated
        const authStorage = localStorage.getItem('auth-storage');
        if (!authStorage || !authStorage.includes(cleanToken)) {
          console.warn('Auth storage might not be updated yet, but token is in localStorage');
        }
        
        toast.success('Login successful!');
        
        // Increased delay to ensure state is fully updated and persisted before navigation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Clear any existing returnPath to ensure clean navigation
        const returnPath = sessionStorage.getItem('returnPath');
        if (returnPath) {
          sessionStorage.removeItem('returnPath');
        }
        
        // Always redirect to home page (dashboard) after successful login
        console.log('Login successful - redirecting to home page');
        
        // Use setTimeout to ensure navigation happens after state updates
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 100);
      } else {
        toast.error('Login failed. Please try again.');
        setIsLoading(false);
      }
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error.message || 'Login failed. Please check your credentials and try again.';
      toast.error(errorMessage);
      console.error('Login error:', error);
    }
  };

  return (
    <motion.div 
      className="min-h-screen bg-black text-white pb-20 md:pb-0 flex items-center justify-center overflow-x-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <motion.div 
        className="w-full max-w-md px-4 md:px-6 py-8 md:py-12 overflow-x-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        {/* Logo and Brand */}
        <motion.div 
          className="text-center mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center justify-center gap-2 md:gap-3 mb-4">
            {logo && (
              <img 
                src={logo} 
                alt="Vintage Beauty Logo" 
                className="h-10 md:h-12 w-auto"
              />
            )}
            <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-wider text-white">
              VINTAGE BEAUTY
            </h1>
          </div>
          <p className="text-gray-400 text-sm md:text-base">
            Login to your account
          </p>
        </motion.div>

        {/* Login Form Card */}
        <motion.div 
          className="bg-gradient-to-br from-gray-900 to-black rounded-xl md:rounded-2xl p-4 md:p-8 border border-gray-800 shadow-xl overflow-x-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-5 md:space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div>
              <label className="block text-sm md:text-base text-gray-400 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your.email@example.com"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm md:text-base text-gray-400 mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  placeholder="Enter your password"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-[#D4AF37] transition-colors pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#D4AF37] transition-colors"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.736m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading || !formData.email.trim() || !formData.password}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-amber-500 hover:from-[#F4D03F] hover:to-amber-400 disabled:from-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed text-black font-bold px-6 py-3 md:py-4 rounded-lg text-base md:text-lg transition-all duration-300 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Logging in...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  <span>Login</span>
                </>
              )}
            </motion.button>
          </motion.form>

          {/* Divider */}
          <div className="my-6 md:my-8 flex items-center gap-4">
            <div className="flex-1 h-px bg-gray-800"></div>
            <span className="text-gray-500 text-sm">OR</span>
            <div className="flex-1 h-px bg-gray-800"></div>
          </div>

          {/* Signup Link */}
          <div className="text-center">
            <p className="text-gray-400 text-sm md:text-base mb-3">
              Don't have an account?
            </p>
            <Link
              to="/signup"
              className="inline-block w-full bg-gray-800 hover:bg-gray-700 text-white font-medium px-6 py-3 rounded-lg text-base transition-all duration-300 border border-gray-700 hover:border-[#D4AF37]/30"
            >
              Create New Account
            </Link>
          </div>
        </motion.div>

        {/* Back to Home */}
        <motion.div 
          className="text-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Link
            to="/"
            className="text-gray-400 hover:text-[#D4AF37] text-sm transition-colors inline-flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </motion.div>
      </motion.div>

      <BottomNavbar />
    </motion.div>
  );
};

export default Login;


