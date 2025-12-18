import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const UserProtectedRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, token } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  // Wait for Zustand persist to hydrate before making auth decision
  useEffect(() => {
    // Check if there's a token in localStorage
    const localStorageToken = localStorage.getItem('token');
    const authStorage = localStorage.getItem('auth-storage');

    if (localStorageToken || authStorage) {
      // Token exists, wait for Zustand to hydrate
      // Check multiple times to ensure Zustand has fully hydrated
      let attempts = 0;
      const maxAttempts = 20; // Check up to 20 times (2 seconds total)
      
      const checkHydration = () => {
        attempts++;
        const currentToken = token || localStorage.getItem('token');
        const currentAuth = isAuthenticated || (currentToken && localStorage.getItem('auth-storage'));
        
        // If Zustand has hydrated (token or isAuthenticated is set), or max attempts reached
        if (currentAuth || attempts >= maxAttempts) {
          setIsChecking(false);
        } else {
          // Check again after a short delay
          setTimeout(checkHydration, 100);
        }
      };
      
      // Start checking after initial delay
      const timer = setTimeout(checkHydration, 100);
      return () => clearTimeout(timer);
    } else {
      // No token, no need to wait
      setIsChecking(false);
    }
  }, [isAuthenticated, token]);

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Check if user is authenticated
  // Check token from Zustand store or localStorage (for hydration race condition)
  const hasToken = token || localStorage.getItem('token');
  
  // If no token at all, redirect to login
  // If token exists (even if Zustand hasn't hydrated yet), allow access
  // The API will validate the token and redirect if invalid
  if (!hasToken) {
    // Store the intended location so we can redirect back after login
    const returnPath = location.pathname + location.search;
    if (returnPath !== '/login' && returnPath !== '/signup') {
      sessionStorage.setItem('returnPath', returnPath);
    }
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // User is authenticated, render the protected content
  return <>{children}</>;
};

export default UserProtectedRoute;

