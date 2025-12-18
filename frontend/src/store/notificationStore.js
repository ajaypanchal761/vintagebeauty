import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export const useNotificationStore = create(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,

      // Add a new notification
      addNotification: (notification) => {
        // Generate unique ID: timestamp + random string to prevent duplicates
        // This ensures uniqueness even if multiple notifications are created in the same millisecond
        const generateUniqueId = () => {
          if (notification.id) return notification.id;
          const timestamp = Date.now();
          const random = Math.random().toString(36).substr(2, 9);
          const counter = Math.floor(Math.random() * 10000);
          return `${timestamp}-${random}-${counter}`;
        };

        const newNotification = {
          id: generateUniqueId(),
          type: notification.type, // 'order', 'announcement', 'coupon'
          title: notification.title,
          message: notification.message,
          data: notification.data || {},
          read: false,
          createdAt: notification.createdAt || new Date().toISOString(),
          ...notification
        };

        set((state) => {
          const updatedNotifications = [newNotification, ...state.notifications];
          // Keep only last 100 notifications
          const limitedNotifications = updatedNotifications.slice(0, 100);
          const unreadCount = limitedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: limitedNotifications,
            unreadCount
          };
        });
      },

      // Mark notification as read
      markAsRead: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notif =>
            notif.id === notificationId ? { ...notif, read: true } : notif
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount
          };
        });
      },

      // Mark all as read
      markAllAsRead: () => {
        set((state) => {
          const updatedNotifications = state.notifications.map(notif => ({
            ...notif,
            read: true
          }));
          
          return {
            notifications: updatedNotifications,
            unreadCount: 0
          };
        });
      },

      // Delete notification
      deleteNotification: (notificationId) => {
        set((state) => {
          const updatedNotifications = state.notifications.filter(
            notif => notif.id !== notificationId
          );
          const unreadCount = updatedNotifications.filter(n => !n.read).length;
          
          return {
            notifications: updatedNotifications,
            unreadCount
          };
        });
      },

      // Clear all notifications
      clearAll: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      // Get unread count
      getUnreadCount: () => {
        return get().unreadCount;
      }
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
);

