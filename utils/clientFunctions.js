'use client';

import { useState, useEffect } from 'react';

export const useAppleDevice = () => {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const applePlatforms = /(iphone|ipad|ipod|mac)/g;
    setIsAppleDevice(applePlatforms.test(userAgent));
  }, []);

  return isAppleDevice;
};

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Only run this logic on the client side
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia(`(max-width: ${768 - 1}px)`);

      const handleMediaQueryChange = (e) => {
        setIsMobile(e.matches);
      };

      // Initial check
      setIsMobile(mediaQuery.matches);

      // Listen for changes
      mediaQuery.addEventListener('change', handleMediaQueryChange);

      // Cleanup
      return () => {
        mediaQuery.removeEventListener('change', handleMediaQueryChange);
      };
    }
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return isMobile;
}
