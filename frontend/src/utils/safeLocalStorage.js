/**
 * Safe LocalStorage Utility
 * Provides error-safe localStorage operations with proper error handling
 * Prevents app crashes due to localStorage issues
 */

/**
 * Safe localStorage wrapper with error handling
 */
export const safeLocalStorage = {
  /**
   * Safely get an item from localStorage
   * @param {string} key - The key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist or error occurs
   * @returns {*} The stored value or default value
   */
  getItem: (key, defaultValue = null) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      return item === null ? defaultValue : item;
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to get item '${key}':`, error.message);
      return defaultValue;
    }
  },

  /**
   * Safely set an item in localStorage
   * @param {string} key - The key to store
   * @param {*} value - The value to store (will be converted to string)
   * @returns {boolean} True if successful, false if failed
   */
  setItem: (key, value) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to set item '${key}':`, error.message);
      return false;
    }
  },

  /**
   * Safely remove an item from localStorage
   * @param {string} key - The key to remove
   * @returns {boolean} True if successful, false if failed
   */
  removeItem: (key) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to remove item '${key}':`, error.message);
      return false;
    }
  },

  /**
   * Safely parse JSON from localStorage
   * @param {string} key - The key to retrieve and parse
   * @param {*} defaultValue - Default value if parsing fails
   * @returns {*} The parsed value or default value
   */
  getParsedItem: (key, defaultValue = null) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return defaultValue;
      }

      const item = localStorage.getItem(key);
      if (item === null) {
        return defaultValue;
      }

      return JSON.parse(item);
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to parse item '${key}':`, error.message);

      // If parsing failed, remove the corrupted data
      try {
        localStorage.removeItem(key);
      } catch (removeError) {
        console.warn(`[SafeLocalStorage] Failed to remove corrupted item '${key}':`, removeError.message);
      }

      return defaultValue;
    }
  },

  /**
   * Safely stringify and store JSON in localStorage
   * @param {string} key - The key to store
   * @param {*} value - The value to stringify and store
   * @returns {boolean} True if successful, false if failed
   */
  setParsedItem: (key, value) => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const stringified = JSON.stringify(value);
      localStorage.setItem(key, stringified);
      return true;
    } catch (error) {
      console.warn(`[SafeLocalStorage] Failed to stringify and set item '${key}':`, error.message);
      return false;
    }
  },

  /**
   * Check if localStorage is available
   * @returns {boolean} True if localStorage is available and working
   */
  isAvailable: () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      const testKey = '__localStorage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (error) {
      return false;
    }
  },

  /**
   * Clear all localStorage items (with error handling)
   * @returns {boolean} True if successful, false if failed
   */
  clear: () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) {
        return false;
      }

      localStorage.clear();
      return true;
    } catch (error) {
      console.warn('[SafeLocalStorage] Failed to clear localStorage:', error.message);
      return false;
    }
  }
};

export default safeLocalStorage;
