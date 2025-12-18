// Navigation helper for use in non-React contexts (like axios interceptors)
// This allows us to use React Router navigation from service files

let navigateFunction = null;

export const setNavigate = (navigate) => {
  navigateFunction = navigate;
};

export const navigateTo = (path, options = {}) => {
  if (navigateFunction) {
    navigateFunction(path, options);
  } else {
    // Fallback to window.location if navigate is not set yet
    // Store return path if redirecting to login
    if (path === '/login' && window.location.pathname !== '/login' && window.location.pathname !== '/signup') {
      sessionStorage.setItem('returnPath', window.location.pathname + window.location.search);
    }
    window.location.href = path;
  }
};

export const clearNavigate = () => {
  navigateFunction = null;
};


