'use client';

import { useState, useEffect, useCallback } from 'react';

export const useAppleDevice = () => {
  const [isAppleDevice, setIsAppleDevice] = useState(false);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    const applePlatforms = /(iphone|ipad|ipod|mac)/g;
    setIsAppleDevice(applePlatforms.test(userAgent));
  }, []);

  return isAppleDevice;
};

/**
 * Reads the browser's current position on demand. Deliberately not fired on
 * mount — the permission prompt should follow a deliberate tap, not a page load.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError({
        code: 'unsupported',
        message: 'This device does not support location sharing.',
      });
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const next = { lat: coords.latitude, lng: coords.longitude };
          setPosition(next);
          setLoading(false);
          resolve(next);
        },
        (geoError) => {
          setError({
            code:
              geoError.code === geoError.PERMISSION_DENIED
                ? 'denied'
                : 'unavailable',
            message:
              geoError.code === geoError.PERMISSION_DENIED
                ? 'Location access was blocked. Enable it for this site to get a route.'
                : 'Could not read your location. Try again with a clearer view of the sky.',
          });
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    });
  }, []);

  return { position, error, loading, request };
}

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
