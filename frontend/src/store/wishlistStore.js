import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import wishlistService from '../services/wishlistService';

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isSyncing: false,
      
      // Sync wishlist from backend
      syncWishlist: async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          // User not logged in, use local storage only
          return;
        }
        
        set({ isSyncing: true });
        try {
          const response = await wishlistService.getWishlist();
          if (response.success) {
            // Backend returns products array (already populated)
            // Use products if available, otherwise fall back to items
            const products = response.products || response.items || [];
            
            // Ensure products are in the correct format
            const formattedProducts = products.map(product => {
              // If product is already an object, use it as is
              if (typeof product === 'object' && product !== null) {
                return product;
              }
              // If it's just an ID, we need to fetch it (shouldn't happen with populate)
              return product;
            });
            
            set({ items: formattedProducts });
          }
        } catch (error) {
          console.error('Failed to sync wishlist:', error);
          // Keep local storage items on error
        } finally {
          set({ isSyncing: false });
        }
      },
      
      addItem: async (product) => {
        const productId = product._id || product.id;
        const token = localStorage.getItem('token');
        
        // Check if already in wishlist
        if (get().isInWishlist(productId)) {
          return;
        }
        
        // Update local state immediately
        set((state) => ({
          items: [...state.items, product]
        }));
        
        // Sync with backend if logged in
        if (token) {
          try {
            await wishlistService.addToWishlist(productId);
            await get().syncWishlist(); // Refresh from backend
          } catch (error) {
            console.error('Failed to add to wishlist on backend:', error);
            // Revert local change on error
            set((state) => ({
              items: state.items.filter(item => (item._id || item.id) !== productId)
            }));
          }
        }
      },
      
      removeItem: async (productId) => {
        const itemId = typeof productId === 'object' ? (productId._id || productId.id) : productId;
        const token = localStorage.getItem('token');
        
        // Update local state immediately
        set((state) => ({
          items: state.items.filter(item => (item._id || item.id) !== itemId)
        }));
        
        // Sync with backend if logged in
        if (token) {
          try {
            await wishlistService.removeFromWishlist(itemId);
            await get().syncWishlist(); // Refresh from backend
          } catch (error) {
            console.error('Failed to remove from wishlist on backend:', error);
            // Keep local changes on error
          }
        }
      },
      
      isInWishlist: (productId) => {
        const itemId = typeof productId === 'object' ? (productId._id || productId.id) : productId;
        return get().items.some(item => (item._id || item.id) === itemId);
      },
      
      toggleItem: async (product) => {
        const productId = product._id || product.id;
        const isInWishlist = get().isInWishlist(productId);
        
        if (isInWishlist) {
          await get().removeItem(productId);
        } else {
          await get().addItem(product);
        }
      },
      
      clearWishlist: async () => {
        const token = localStorage.getItem('token');
        
        // Update local state immediately
        set({ items: [] });
        
        // Sync with backend if logged in
        if (token) {
          try {
            await wishlistService.clearWishlist();
          } catch (error) {
            console.error('Failed to clear wishlist on backend:', error);
            // Keep local changes on error
          }
        }
      },
      
      getCount: () => get().items.length
    }),
    {
      name: 'wishlist-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
