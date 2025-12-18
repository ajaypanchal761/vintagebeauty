import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import socketService from '../services/socketService';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      token: null,
      loginTimestamp: null,
      _hasHydrated: false,
      
      setHasHydrated: (state) => {
        set({ _hasHydrated: state });
      },
      
      initialize: () => {
        // This is called manually, but Zustand persist should handle hydration automatically
        // Just ensure token is synced with localStorage
        const storedState = JSON.parse(localStorage.getItem('auth-storage') || 'null');
        const tokenFromStorage = localStorage.getItem('token');
        
        if (storedState?.state?.user && storedState?.state?.token) {
          set({ 
            user: storedState.state.user, 
            isAuthenticated: true, 
            token: storedState.state.token,
            loginTimestamp: storedState.state.loginTimestamp || null
          });
          
          // Ensure token is also in localStorage (in case it was lost)
          if (storedState.state.token && !tokenFromStorage) {
            localStorage.setItem('token', storedState.state.token);
          }
        } else if (tokenFromStorage) {
          // Token exists in localStorage but not in Zustand - restore it
          // This handles cases where Zustand state was cleared but token remains
          const loginTimestamp = localStorage.getItem('loginTimestamp');
          set({
            isAuthenticated: true,
            token: tokenFromStorage,
            loginTimestamp: loginTimestamp ? parseInt(loginTimestamp) : null
          });
        }
      },
      
      login: (userData, token) => {
        // Trim token to remove any whitespace
        const cleanToken = token ? String(token).trim() : null;
        const loginTime = Date.now();
        
        if (!cleanToken) {
          console.error('Login called with invalid token');
          return;
        }
        
        // Update Zustand state
        set({
          user: userData,
          isAuthenticated: true,
          token: cleanToken,
          loginTimestamp: loginTime
        });
        
        // CRITICAL: Store token and timestamp synchronously in localStorage
        // This ensures token is available even if Zustand persist hasn't finished
        localStorage.setItem('token', cleanToken);
        localStorage.setItem('loginTimestamp', loginTime.toString());
        
        // User data is already stored in Zustand's auth-storage (persisted automatically)
        // No need for separate localStorage 'user' key
        
        // Verify storage was successful
        const storedToken = localStorage.getItem('token');
        if (storedToken !== cleanToken) {
          console.error('Token storage verification failed!', {
            expected: cleanToken,
            stored: storedToken
          });
        }

        // Reconnect Socket.IO with new token to enable order notifications
        try {
          socketService.reconnect();
        } catch (error) {
          console.error('Failed to reconnect socket after login:', error);
        }
      },
      
      logout: () => {
        // Only clear auth-related items, preserve other localStorage data
        set({
          user: null,
          isAuthenticated: false,
          token: null,
          loginTimestamp: null
        });
        
        // Only remove auth-specific items, don't touch other localStorage data
        // Use try-catch to prevent errors if items don't exist
        try {
          if (localStorage.getItem('token')) {
            localStorage.removeItem('token');
          }
          // User data is stored in auth-storage (Zustand), will be cleared with auth-storage
          // No separate 'user' key needed
          if (localStorage.getItem('auth-storage')) {
            localStorage.removeItem('auth-storage');
          }
          if (localStorage.getItem('loginTimestamp')) {
            localStorage.removeItem('loginTimestamp');
          }
        } catch (error) {
          console.error('Error clearing localStorage:', error);
        }
        
        // Note: We intentionally do NOT clear other localStorage items like:
        // - wishlist-storage
        // - cart-storage
        // - address-storage
        // - order-storage
        // etc.
      },
      
      signup: (userData, token) => {
        // Trim token to remove any whitespace
        const cleanToken = token ? String(token).trim() : null;
        const loginTime = Date.now();
        
        if (!cleanToken) {
          console.error('Signup called with invalid token');
          return;
        }
        
        // Update Zustand state
        set({
          user: userData,
          isAuthenticated: true,
          token: cleanToken,
          loginTimestamp: loginTime
        });
        
        // CRITICAL: Store token and timestamp synchronously in localStorage
        // This ensures token is available even if Zustand persist hasn't finished
        localStorage.setItem('token', cleanToken);
        localStorage.setItem('loginTimestamp', loginTime.toString());
        
        // User data is already stored in Zustand's auth-storage (persisted automatically)
        // No need for separate localStorage 'user' key
        
        // Verify storage was successful
        const storedToken = localStorage.getItem('token');
        if (storedToken !== cleanToken) {
          console.error('Token storage verification failed!', {
            expected: cleanToken,
            stored: storedToken
          });
        }

        // Reconnect Socket.IO with new token to enable order notifications
        try {
          socketService.reconnect();
        } catch (error) {
          console.error('Failed to reconnect socket after signup:', error);
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated, 
        token: state.token,
        loginTimestamp: state.loginTimestamp
      }),
      // Ensure state is rehydrated on mount
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating auth store:', error);
          } else if (state) {
            // Ensure token is synced with localStorage after rehydration
            const tokenFromStorage = localStorage.getItem('token');
            if (state.token && !tokenFromStorage) {
              localStorage.setItem('token', state.token);
            } else if (tokenFromStorage && !state.token) {
              // Token in localStorage but not in state - restore it
              state.token = tokenFromStorage;
              state.isAuthenticated = true;
            }
            state._hasHydrated = true;
          }
        };
      },
    }
  )
);

