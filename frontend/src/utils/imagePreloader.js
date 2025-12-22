/**
 * Image Preloading Utility
 * Preloads critical images for better performance
 */

// Preload a single image
export const preloadImage = (src) => {
  return new Promise((resolve, reject) => {
    if (!src) {
      resolve();
      return;
    }

    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error(`Failed to preload image: ${src}`));
    img.src = src;
  });
};

// Preload multiple images
export const preloadImages = (sources) => {
  if (!Array.isArray(sources)) {
    sources = [sources];
  }

  const promises = sources
    .filter(src => src) // Filter out empty/null sources
    .map(src => preloadImage(src));

  return Promise.allSettled(promises);
};

// Preload critical app images
export const preloadCriticalImages = async () => {
  try {
    const criticalImages = [
      '/logo%20vintage.png',
      '/heroimg.png',
      // Add other frequently accessed images here
    ];

   
    const results = await preloadImages(criticalImages);

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

  

    return { successful, failed };
  } catch (error) {
    console.error('[ImagePreloader] Error preloading critical images:', error);
    return { successful: 0, failed: 1 };
  }
};

// Preload product images (for product lists)
export const preloadProductImages = async (products, limit = 12) => {
  try {
    if (!products || !Array.isArray(products)) return;

    // Get first N product images
    const productImages = products
      .slice(0, limit)
      .map(product => product?.images?.[0] || product?.image)
      .filter(src => src);

    if (productImages.length === 0) return;

   
    await preloadImages(productImages);
   
  } catch (error) {
    console.error('[ImagePreloader] Error preloading product images:', error);
  }
};

// Create and inject preload links for critical resources
export const injectPreloadLinks = () => {
  if (typeof document === 'undefined') return;

  const preloadLinks = [
    // Critical CSS (if split)
    // { href: '/assets/index-*.css', as: 'style', rel: 'preload' },

    // Critical images
    { href: '/logo%20vintage.png', as: 'image', rel: 'preload' },
    { href: '/heroimg.png', as: 'image', rel: 'preload' },

    // Critical fonts (if any)
    // { href: '/fonts/main.woff2', as: 'font', rel: 'preload', type: 'font/woff2', crossOrigin: 'anonymous' }
  ];

  preloadLinks.forEach(({ href, as, rel = 'preload', ...attrs }) => {
    // Check if link already exists
    const existingLink = document.querySelector(`link[href="${href}"]`);
    if (existingLink) return;

    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    link.as = as;

    // Add other attributes
    Object.keys(attrs).forEach(key => {
      link.setAttribute(key, attrs[key]);
    });

    // Add to head
    document.head.appendChild(link);
  });

 
};

// Smart preloading based on current route
export const preloadForRoute = async (pathname, products = []) => {
  try {
    // Always preload critical images
    await preloadCriticalImages();

    // Route-specific preloading
    if (pathname === '/' || pathname.startsWith('/products')) {
      // Preload first 12 product images for product listings (increased for faster loading)
      await preloadProductImages(products, 12);
    }

    if (pathname.startsWith('/product/')) {
      // Preload product detail images
      if (products && products.length > 0) {
        const product = products[0];
        if (product?.images) {
          await preloadImages(product.images);
        }
      }
    }

    
  } catch (error) {
    console.error('[ImagePreloader] Error in route-specific preloading:', error);
  }
};
