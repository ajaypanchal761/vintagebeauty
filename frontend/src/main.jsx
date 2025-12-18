import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Suppress known third-party console errors (browser extensions, etc.)
if (typeof window !== 'undefined') {
  const originalError = console.error;
  const originalWarn = console.warn;
  
  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    const fullMessage = args.map(arg => String(arg)).join(' ');
    
    // Suppress Sentry DSN errors from browser extensions/dev tools
    if (message.includes('Invalid Sentry Dsn') || 
        (message.includes('sentry.io') && message.includes('dsn'))) {
      return; // Suppress this error - it's from a browser extension
    }
    
    // Suppress Socket.IO connection errors when backend is not available
    if (fullMessage.includes('Socket.IO connection error') ||
        fullMessage.includes('TransportError') ||
        fullMessage.includes('websocket error') ||
        fullMessage.includes('WebSocket connection to') && fullMessage.includes('failed')) {
      return; // Suppress Socket.IO connection errors - they're handled gracefully
    }
    
    originalError.apply(console, args);
  };
  
  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    // Suppress service worker manifest format warnings
    // This is usually from browser trying to parse manifest with service worker references
    if (message.includes('serviceworker') && 
        message.includes('manifest') && 
        message.includes('must be a dictionary')) {
      return; // Suppress format warning - we don't use service workers
    }
    originalWarn.apply(console, args);
  };
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
