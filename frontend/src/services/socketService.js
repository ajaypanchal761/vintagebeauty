import { io } from 'socket.io-client';
import { API_CONFIG } from '../api/config/apiConfig';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    // Extract base URL without /api suffix for Socket.IO (Socket.IO connects to server root)
    const baseURL = API_CONFIG.baseURL.replace('/api', '');
    const backendUrl = baseURL || 'https://vintagebeauty-1.onrender.com';
    
    // Log connection attempt only in development (and only once)
    if (import.meta.env.DEV && !this._connectionLogged) {
      console.log('Socket.IO connecting to:', backendUrl);
      this._connectionLogged = true;
    }
    
    // Get authentication token from localStorage or Zustand store
    let token = localStorage.getItem('token');
    if (!token) {
      // Try to get from Zustand auth store if available
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const authData = JSON.parse(authStorage);
          token = authData?.state?.token || null;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    this.socket = io(backendUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000, // Start with 2 second delay
      reconnectionAttempts: 5, // Limit retry attempts to avoid spam
      reconnectionDelayMax: 10000, // Max delay between retries
      timeout: 10000, // Connection timeout (10 seconds - reduced from 20)
      forceNew: false,
      upgrade: true,
      rememberUpgrade: true,
      auth: {
        token: token || null
      },
      query: {
        token: token || null
      },
      // Add extra options for better connection handling
      autoConnect: true,
      // Increase ping timeout for slow connections
      pingTimeout: 60000,
      pingInterval: 25000,
      // Suppress connection errors in console
      withCredentials: true
    });

    this.socket.on('connect', () => {
      this.isConnected = true;
      console.log('Socket.IO connected:', this.socket.id);
      
      // Re-authenticate if token is available
      if (token) {
        this.socket.emit('authenticate', { token });
      }
    });

    this.socket.on('disconnect', () => {
      this.isConnected = false;
      console.log('Socket.IO disconnected');
    });

    this.socket.on('connect_error', (error) => {
      // Suppress common connection errors that are expected when backend is not available
      const errorMessage = error?.message || '';
      const errorType = error?.type || '';
      
      // Suppress these common errors:
      // - WebSocket connection failures (backend not running)
      // - Transport errors (network issues)
      // - Timeout errors (slow connections)
      // - XHR poll errors (fallback transport failures)
      const shouldSuppress = 
        errorType === 'TransportError' ||
        errorMessage.includes('websocket error') ||
        errorMessage.includes('WebSocket connection failed') ||
        errorMessage.includes('timeout') ||
        errorMessage.includes('xhr poll error') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('Network Error');
      
      if (!shouldSuppress && import.meta.env.DEV) {
        // Only log non-common errors in development
        console.warn('Socket.IO connection error:', error);
      }
      
      // In production, silently handle all connection errors - Socket.IO will retry automatically
      this.isConnected = false;
    });

    // Listen for authentication errors (but don't log non-critical errors)
    this.socket.on('error', (error) => {
      // Only log errors that are not about missing orders (these are normal during order creation)
      if (error.message && 
          !error.message.includes('Not authorized to access this order') &&
          !error.message.includes('Order not found')) {
        console.error('Socket.IO error:', error);
      }
      // Silently ignore order-related errors as they're expected during order creation
    });

    return this.socket;
  }

  // Reconnect with new token (call this after login)
  reconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    return this.connect();
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
      console.log('Socket.IO disconnected manually');
    }
  }

  joinOrderRoom(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-order-room', orderId);
      console.log(`Joined order room: order-${orderId}`);
    }
  }

  leaveOrderRoom(orderId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('leave-order-room', orderId);
      console.log(`Left order room: order-${orderId}`);
    }
  }

  onOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.on('order-status-updated', callback);
    }
  }

  offOrderStatusUpdate(callback) {
    if (this.socket) {
      this.socket.off('order-status-updated', callback);
    }
  }

  onNewAnnouncement(callback) {
    if (this.socket) {
      this.socket.on('new-announcement', callback);
    }
  }

  offNewAnnouncement(callback) {
    if (this.socket) {
      this.socket.off('new-announcement', callback);
    }
  }

  onNewCoupon(callback) {
    if (this.socket) {
      this.socket.on('new-coupon', callback);
    }
  }

  offNewCoupon(callback) {
    if (this.socket) {
      this.socket.off('new-coupon', callback);
    }
  }

  getSocket() {
    return this.socket;
  }
}

// Export singleton instance
const socketService = new SocketService();
export default socketService;

