import { useEffect } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import socketService from '../services/socketService';
// Toast notifications disabled for socket events
// import toast from 'react-hot-toast';

const NotificationListener = () => {
  const { addNotification } = useNotificationStore();

  useEffect(() => {
    // Connect to Socket.IO with error handling - don't block app if it fails
    // The socket will automatically join user's order rooms on backend after authentication
    try {
      const socket = socketService.connect();
      
      // If socket is null (backend URL not configured), skip connection
      if (!socket) {
        console.warn('Socket.IO: Backend URL not configured. Skipping connection.');
        return;
      }
      
      // Set a timeout to warn if connection takes too long (but don't block)
      const connectionTimeout = setTimeout(() => {
        if (!socketService.isConnected) {
          // Only warn in development
          if (import.meta.env.DEV) {
            console.warn('Socket.IO connection timeout - continuing without real-time updates');
          }
          // Don't disconnect, let it keep trying in background
        }
      }, 15000); // 15 seconds timeout
      
      // Clear timeout if connected
      socket.on('connect', () => {
        clearTimeout(connectionTimeout);
      });
      
      return () => {
        clearTimeout(connectionTimeout);
      };
    } catch (error) {
      // Silently fail - Socket.IO is optional for app functionality
      if (import.meta.env.DEV) {
        console.warn('Socket.IO connection failed - app will continue without real-time updates:', error.message);
      }
    }

    // DISABLED: Order status update notifications
    // Users will NOT receive delivery status notifications via Socket.IO
    // const handleOrderStatusUpdate = (data) => {
    //   const { orderId, orderStatus } = data;
    //   
    //   const statusMessages = {
    //     'confirmed': 'Your order has been confirmed',
    //     'processing': 'Your order is being processed',
    //     'shipped': 'Your order has been shipped',
    //     'out-for-delivery': 'Your order is out for delivery',
    //     'delivered': 'Your order has been delivered'
    //   };
    //   const message = statusMessages[orderStatus] || `Your order status has been updated to ${orderStatus}`;
    //   addNotification({
    //     type: 'order',
    //     title: 'Order Status Update',
    //     message: message,
    //     data: { orderId: orderId }
    //   });
    //   toast.success(message, { icon: '📦', duration: 3000 });
    // };

    // DISABLED: Announcement notifications
    // Users will NOT receive announcement notifications via Socket.IO
    // const handleNewAnnouncement = (data) => {
    //   addNotification({
    //     id: data.id,
    //     type: 'announcement',
    //     title: data.title || 'New Announcement',
    //     message: data.message || 'A new announcement has been posted',
    //     data: {
    //       announcementId: data.data?.announcementId,
    //       link: data.data?.link
    //     },
    //     createdAt: data.createdAt
    //   });
    //   toast.success(data.title || 'New Announcement', { icon: '🔔', duration: 4000 });
    // };

    // DISABLED: Coupon notifications
    // Users will NOT receive coupon notifications via Socket.IO
    // const handleNewCoupon = (data) => {
    //   addNotification({
    //     id: data.id,
    //     type: 'coupon',
    //     title: data.title || 'New Coupon Available!',
    //     message: data.message || 'A new coupon has been added',
    //     data: {
    //       couponId: data.data?.couponId,
    //       couponCode: data.data?.couponCode,
    //       discountValue: data.data?.discountValue,
    //       discountType: data.data?.discountType
    //     },
    //     createdAt: data.createdAt
    //   });
    //   toast.success(data.message || 'New Coupon Available!', { icon: '🎟️', duration: 4000 });
    // };

    // All Socket.IO notification listeners are DISABLED
    // socketService.onOrderStatusUpdate(handleOrderStatusUpdate);
    // socketService.onNewAnnouncement(handleNewAnnouncement);
    // socketService.onNewCoupon(handleNewCoupon);

    // Cleanup - no listeners to remove since they're disabled
    return () => {
      // socketService.offOrderStatusUpdate(handleOrderStatusUpdate);
      // socketService.offNewAnnouncement(handleNewAnnouncement);
      // socketService.offNewCoupon(handleNewCoupon);
    };
  }, [addNotification]);

  return null; // This component doesn't render anything
};

export default NotificationListener;

