import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import cartService from '../services/cartService';
import { useAuthStore } from './authStore';
import { trackAddToCart } from '../utils/activityTracker';

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,
      isSyncing: false,
      
      // Sync cart from backend
      syncCart: async () => {
        const { isAuthenticated } = useAuthStore.getState();
        if (!isAuthenticated) {
          // User not logged in, use local storage only
          return;
        }
        
        set({ isSyncing: true });
        try {
          const response = await cartService.getCart();
          const currentItems = get().items; // Preserve current items
          
          if (response.success) {
            // Get items from response (try multiple paths)
            const backendItems = response.items || response.data?.items || [];
            
            if (backendItems && backendItems.length > 0) {
              // Transform backend items to match frontend format
              const transformedItems = backendItems.map(item => {
                // Handle both populated product object and product ID
                const product = item.product?._id ? item.product : (item.product || {});
                const productId = product._id || product.id || item.product;
                
                return {
                  _id: item._id,
                  product: product._id ? product : productId, // Keep full product object if available, otherwise use ID
                  name: item.name || product.name || 'Product',
                  image: item.image || product.images?.[0] || product.image || null,
                  quantity: item.quantity || 1,
                  size: item.size || null,
                  price: item.selectedPrice || item.price || product.price || 699,
                  selectedPrice: item.selectedPrice || item.price || product.price || 699,
                  comboDeal: item.comboDeal || null
                };
              });
              set({ items: transformedItems });
            } else {
              // Backend cart is empty, but keep local items if they exist
              // Only clear if we're sure backend is the source of truth
              if (currentItems.length === 0) {
                set({ items: [] });
              }
              // Otherwise keep local items
            }
          }
        } catch (error) {
          // Silently handle 401 - user not authenticated, use local storage
          if (error.response?.status !== 401 && error.status !== 401) {
          console.error('Failed to sync cart:', error);
          }
          // Keep local storage items on error - don't clear them
          // This ensures items added locally persist even if sync fails
        } finally {
          set({ isSyncing: false });
        }
      },
      
      addItem: async (product, quantity = 1, size = null, comboDeal = null) => {
        const token = localStorage.getItem('token');
        const productId = product._id || product.id || product;
        const selectedSize = size || (product.sizes?.[2]?.size || product.sizes?.[0]?.size || '100ml');
        const selectedPrice = size 
          ? product.sizes?.find(s => s.size === size)?.price 
          : (product.sizes?.[2]?.price || product.sizes?.[0]?.price || product.price || 699);
        const stockValue = Number(
          product?.stock ??
          product?.product?.stock
        );
        const isStockKnown = Number.isFinite(stockValue);
        const existingItem = get().items.find(item => {
          const itemProductId = typeof item.product === 'object' 
            ? String(item.product._id || item.product.id)
            : String(item.product || '');
          return String(itemProductId) === String(productId) && item.size === selectedSize;
        });
        const currentQuantity = existingItem?.quantity || 0;
        const newQuantity = currentQuantity + quantity;

        // Block adding items that are out of stock or exceed available quantity
        if (product?.inStock === false || (isStockKnown && stockValue <= 0)) {
          throw {
            success: false,
            message: 'This item is out of stock',
            code: 'OUT_OF_STOCK'
          };
        }

        if (isStockKnown && newQuantity > stockValue) {
          const remaining = Math.max(stockValue - currentQuantity, 0);
          throw {
            success: false,
            message: remaining > 0 
              ? `Only ${remaining} left in stock`
              : 'This item is out of stock',
            code: 'OUT_OF_STOCK'
          };
        }
        
        // Update local state immediately for better UX
        set((state) => {
          const productIdStr = String(productId);
          const existingItem = state.items.find(item => {
            // Extract product ID - handle both string and object
            const itemProductId = typeof item.product === 'object' 
              ? String(item.product._id || item.product.id)
              : String(item.product || '');
            return String(itemProductId) === productIdStr && item.size === selectedSize;
          });
          
          if (existingItem) {
            return {
              items: state.items.map(item => {
                // Extract product ID - handle both string and object
                const itemProductId = typeof item.product === 'object' 
                  ? String(item.product._id || item.product.id)
                  : String(item.product || '');
                if (String(itemProductId) === productIdStr && item.size === selectedSize) {
                  const updatedItem = { ...item, quantity: item.quantity + quantity };
                  // Update combo deal info if provided
                  if (comboDeal) {
                    updatedItem.comboDeal = comboDeal;
                  }
                  return updatedItem;
                }
                return item;
              })
            };
          }
          
          const newItem = {
            product: productId,
            name: product.name,
            image: product.images?.[0] || product.image,
            quantity,
            size: selectedSize,
            price: selectedPrice,
            selectedPrice
          };
          
          // Add combo deal info if provided
          if (comboDeal) {
            newItem.comboDeal = comboDeal;
          }
          
          return {
            items: [...state.items, newItem]
          };
        });
        
        // Track add to cart activity (fire and forget)
        try {
          trackAddToCart(product, quantity);
        } catch (trackError) {
          // Silently fail - analytics should never break cart functionality
        }
        
        // Sync with backend if logged in
        if (token) {
          try {
            await cartService.addToCart(productId, quantity, selectedSize, comboDeal);
            // Refresh from backend to get the updated cart with proper structure
            await get().syncCart();
          } catch (error) {
            // Handle 401 - user not authenticated or token expired
            if (error.isUnauthorized || error.response?.status === 401 || error.status === 401) {
              // Clear invalid token and use local storage only
              const { logout } = useAuthStore.getState();
              logout();
              // Show message to user (will be handled by component)
              throw { ...error, shouldShowLoginMessage: true };
            }
            if (error?.message?.toLowerCase().includes('stock')) {
              // Backend says stock is insufficient; resync to revert optimistic update
              await get().syncCart();
              throw { success: false, message: error.message, code: 'OUT_OF_STOCK' };
            }
            console.error('Failed to add to cart on backend:', error);
            // Keep local changes on error - don't clear them
          }
        }
      },
      
      removeItem: async (productId, size = null) => {
        const token = localStorage.getItem('token');
        const itemId = String(typeof productId === 'object' ? (productId._id || productId.id) : productId);
        
        // Update local state immediately
        set((state) => ({
          items: state.items.filter(item => {
            // Extract product ID - handle both string and object
            const itemProductId = typeof item.product === 'object' 
              ? String(item.product._id || item.product.id)
              : String(item.product || item.id || '');
            const itemSize = item.size || null;
            // Compare as strings and match size
            return !(String(itemProductId) === String(itemId) && (size === null || itemSize === size));
          })
        }));
        
        // Sync with backend if logged in
        if (token) {
          try {
            // Find the cart item ID from backend
            const cart = await cartService.getCart();
            const backendItem = cart.items?.find(item => {
              const itemProductId = item.product?._id || item.product?.id || item.product;
              return itemProductId === itemId && (size === null || item.size === size);
            });
            
            if (backendItem?._id) {
              await cartService.removeFromCart(backendItem._id);
            }
            await get().syncCart(); // Refresh from backend
          } catch (error) {
            // Silently handle 401 - user not authenticated
            if (error.response?.status !== 401 && error.status !== 401) {
            console.error('Failed to remove from cart on backend:', error);
            }
            // Keep local changes on error
          }
        }
      },
      
      updateQuantity: async (productId, quantity, size = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        
        const token = localStorage.getItem('token');
        const itemId = String(typeof productId === 'object' ? (productId._id || productId.id) : productId);
        
        // Update local state immediately
        set((state) => ({
          items: state.items.map(item => {
            // Extract product ID - handle both string and object
            const itemProductId = typeof item.product === 'object' 
              ? String(item.product._id || item.product.id)
              : String(item.product || item.id || '');
            const itemSize = item.size || null;
            // Compare as strings and match size
            if (String(itemProductId) === String(itemId) && (size === null || itemSize === size)) {
              return { ...item, quantity };
            }
            return item;
          })
        }));
        
        // Sync with backend if logged in
        if (token) {
          try {
            // Find the cart item ID from backend
            const cart = await cartService.getCart();
            const backendItem = cart.items?.find(item => {
              const itemProductId = item.product?._id || item.product?.id || item.product;
              return itemProductId === itemId && (size === null || item.size === size);
            });
            
            if (backendItem?._id) {
              await cartService.updateCartItem(backendItem._id, quantity, size, backendItem.selectedPrice);
            }
            await get().syncCart(); // Refresh from backend
          } catch (error) {
            // Silently handle 401 - user not authenticated
            if (error.response?.status !== 401 && error.status !== 401) {
            console.error('Failed to update cart on backend:', error);
            }
            // Keep local changes on error
          }
        }
      },
      
      clearCart: async () => {
        const token = localStorage.getItem('token');
        
        // Update local state immediately
        set({ items: [] });
        
        // Sync with backend if logged in
        if (token) {
          try {
            await cartService.clearCart();
          } catch (error) {
            // Silently handle 401 - user not authenticated
            if (error.response?.status !== 401 && error.status !== 401) {
            console.error('Failed to clear cart on backend:', error);
            }
            // Keep local changes on error
          }
        }
      },
      
      getItemCount: () => {
        return get().items.reduce((total, item) => total + (item.quantity || 0), 0);
      },
      
      getTotalPrice: () => {
        const items = get().items;
        
        // Group items by combo deal
        const comboDealGroups = {};
        const regularItems = [];
        
        items.forEach(item => {
          if (item.comboDeal && item.comboDeal.dealId) {
            const dealId = String(item.comboDeal.dealId);
            if (!comboDealGroups[dealId]) {
              comboDealGroups[dealId] = {
                dealId: dealId,
                dealPrice: item.comboDeal.dealPrice,
                requiredItems: item.comboDeal.requiredItems,
                items: []
              };
            }
            comboDealGroups[dealId].items.push(item);
          } else {
            regularItems.push(item);
          }
        });
        
        let total = 0;
        
        // Calculate combo deal totals
        Object.values(comboDealGroups).forEach(group => {
          // Count total distinct items in this combo deal group
          const totalItemCount = group.items.length;
          
          // Check if we have the required number of distinct items for the deal
          if (totalItemCount >= group.requiredItems) {
            // Calculate how many complete combo deals we can form
            const completeDeals = Math.floor(totalItemCount / group.requiredItems);
            const remainingItems = totalItemCount % group.requiredItems;
            
            // Apply deal price for complete combo deals
            total += completeDeals * (Number(group.dealPrice) || 0);
            
            // Calculate price for remaining items at regular price
            if (remainingItems > 0) {
              const remainingItemsList = group.items.slice(-remainingItems);
              remainingItemsList.forEach(item => {
                const price = Number(item.selectedPrice) || Number(item.price) || 699;
                const quantity = Number(item.quantity) || 0;
                total += price * quantity;
              });
            }
          } else {
            // Not enough distinct items for deal, use regular prices for all items
            group.items.forEach(item => {
              const price = Number(item.selectedPrice) || Number(item.price) || 699;
              const quantity = Number(item.quantity) || 0;
              total += price * quantity;
            });
          }
        });
        
        // Calculate regular items totals
        regularItems.forEach(item => {
          const price = Number(item.selectedPrice) || Number(item.price) || Number(item.product?.price) || 699;
          const quantity = Number(item.quantity) || 0;
          const itemTotal = price * quantity;
          total += isNaN(itemTotal) ? 0 : itemTotal;
        });
        
        return total;
      },
      
      isInCart: (productId, size = null) => {
        const itemId = typeof productId === 'object' ? (productId._id || productId.id) : productId;
        return get().items.some(item => {
          const itemProductId = item.product?._id || item.product?.id || item.product;
          return itemProductId === itemId && (size === null || item.size === size);
        });
      }
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

