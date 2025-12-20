import React, { useState, useEffect, useRef, useCallback } from 'react';

const VirtualScroll = ({
  items,
  itemHeight = 200,
  containerHeight = 600,
  renderItem,
  className = '',
  overscan = 5
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeightState, setContainerHeightState] = useState(containerHeight);
  const scrollElementRef = useRef(null);

  // Calculate visible range
  const totalHeight = items.length * itemHeight;
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeightState) / itemHeight) + overscan
  );

  // Get visible items
  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    ...item,
    virtualIndex: startIndex + index
  }));

  // Handle scroll
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  // Update container height on resize
  useEffect(() => {
    const updateHeight = () => {
      if (scrollElementRef.current) {
        setContainerHeightState(scrollElementRef.current.clientHeight);
      }
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  return (
    <div
      ref={scrollElementRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item) => (
            <div
              key={item.virtualIndex}
              style={{ height: itemHeight }}
            >
              {renderItem(item, item.virtualIndex)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VirtualScroll;
