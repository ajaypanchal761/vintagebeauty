import React from 'react';
import { useLazyImage } from '../hooks/useIntersectionObserver';
import heroimg from '../assets/heroimg.png';

/**
 * LazyImage component with intersection observer
 * Automatically loads images when they enter viewport
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = heroimg,
  onLoad,
  onError,
  priority = false, // New prop for priority loading
  ...props
}) => {
  const { ref, src: imageSrc, isLoaded, hasError, shouldLoad } = useLazyImage(src, placeholder, priority);

  const handleLoad = () => {
    if (onLoad) onLoad();
  };

  const handleError = () => {
    if (onError) onError();
  };

  return (
    <img
      ref={ref}
      src={imageSrc}
      alt={alt}
      className={`${className} ${isLoaded ? 'loaded' : 'loading'}`}
      onLoad={handleLoad}
      onError={handleError}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;
