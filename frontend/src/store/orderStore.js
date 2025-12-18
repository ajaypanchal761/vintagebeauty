import { create } from 'zustand';

export const useOrderStore = create(
  (set, get) => ({
    orders: [],
    
    addOrder: (orderData) => {
      const order = {
        id: 'ORD' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase(),
        orderNumber: 'VB' + Date.now(),
        ...orderData,
        createdAt: new Date().toISOString(),
        orderStatus: 'confirmed',
        paymentStatus: 'completed',
        trackingNumber: 'TRK' + Date.now() + Math.random().toString(36).substr(2, 6).toUpperCase(),
        trackingHistory: [
          {
            status: 'Order Placed',
            date: new Date().toISOString(),
            description: 'Your order has been placed successfully',
            completed: true
          },
          {
            status: 'Confirmed',
            date: new Date().toISOString(),
            description: 'Order confirmed and payment received',
            completed: true
          },
          {
            status: 'Processing',
            date: null,
            description: 'Your order is being processed',
            completed: false
          },
          {
            status: 'Shipped',
            date: null,
            description: 'Your order has been shipped',
            completed: false
          },
          {
            status: 'Out for Delivery',
            date: null,
            description: 'Your order is out for delivery',
            completed: false
          },
          {
            status: 'Delivered',
            date: null,
            description: 'Your order has been delivered',
            completed: false
          }
        ]
      };
      
      set((state) => ({
        orders: [order, ...state.orders]
      }));
      
      return order;
    },
    
    getOrders: () => {
      return get().orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    
    getOrderById: (orderId) => {
      return get().orders.find(order => order.id === orderId);
    },
    
    updateOrderStatus: (orderId, status) => {
      set((state) => ({
        orders: state.orders.map(order => {
          if (order.id === orderId) {
            // Update tracking history
            const updatedHistory = order.trackingHistory.map((track, index) => {
              const statusMap = {
                'confirmed': 1,
                'processing': 2,
                'shipped': 3,
                'out-for-delivery': 4,
                'delivered': 5
              };
              
              const statusIndex = statusMap[status.toLowerCase()];
              if (statusIndex !== undefined && index <= statusIndex) {
                return {
                  ...track,
                  completed: true,
                  date: track.date || new Date().toISOString()
                };
              }
              return track;
            });
            
            return {
              ...order,
              orderStatus: status,
              trackingHistory: updatedHistory
            };
          }
          return order;
        })
      }));
    }
  })
);

