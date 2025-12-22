import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for Intersection Observer API
 * Provides smooth animations and lazy loading when elements enter viewport
 */
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef(null);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px',
    triggerOnce: true,
    ...options
  };

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Check if IntersectionObserver is supported
    if (!('IntersectionObserver' in window)) {
      setIsIntersecting(true);
      setHasIntersected(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting;
        setIsIntersecting(isElementIntersecting);

        if (isElementIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: defaultOptions.threshold,
        rootMargin: defaultOptions.rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [defaultOptions.threshold, defaultOptions.rootMargin, hasIntersected]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
    // Utility classes for animations
    animationClass: hasIntersected ? 'animate-in' : '',
    opacityClass: hasIntersected ? 'opacity-100' : 'opacity-0',
    translateClass: hasIntersected ? 'translate-y-0' : 'translate-y-4'
  };
};

/**
 * Hook for lazy loading images with intersection observer
 */
export const useLazyImage = (src, placeholder = '', priority = false) => {
  const [imageSrc, setImageSrc] = useState(priority ? src : placeholder);
  const [isLoaded, setIsLoaded] = useState(priority);
  const [hasError, setHasError] = useState(false);

  // For priority images, load immediately without intersection observer
  const { ref, hasIntersected } = useIntersectionObserver({
    threshold: priority ? 0 : 0.1,
    rootMargin: priority ? '0px' : '150px' // Increased rootMargin for better performance
  });

  useEffect(() => {
    // If priority loading is enabled, load immediately
    if (priority && src && imageSrc !== src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(true);
      };
      return;
    }

    // Regular lazy loading for non-priority images
    if (hasIntersected && src && imageSrc !== src) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        setImageSrc(src);
        setIsLoaded(true);
      };
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(true);
      };
    }
  }, [hasIntersected, src, imageSrc, priority]);

  return {
    ref,
    src: imageSrc,
    isLoaded,
    hasError,
    shouldLoad: hasIntersected
  };
};

/**
 * Hook for staggered animations using intersection observer
 */
export const useStaggeredAnimation = (items, staggerDelay = 100) => {
  const [animatedItems, setAnimatedItems] = useState([]);

  useEffect(() => {
    if (!items || items.length === 0) return;

    const newAnimatedItems = items.map((item, index) => ({
      ...item,
      animationDelay: index * staggerDelay,
      isVisible: false
    }));

    setAnimatedItems(newAnimatedItems);

    // Trigger animations with stagger
    newAnimatedItems.forEach((item, index) => {
      setTimeout(() => {
        setAnimatedItems(prev =>
          prev.map((prevItem, prevIndex) =>
            prevIndex === index ? { ...prevItem, isVisible: true } : prevItem
          )
        );
      }, index * staggerDelay);
    });
  }, [items, staggerDelay]);

  return animatedItems;
};
