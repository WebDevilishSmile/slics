'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAppleDevice } from '@/hooks/useAppleDevice';

// Which maps app Navigate and pinned spots open on this device: a per-viewer
// convenience in localStorage. Apple Maps is only offered, and only
// remembered, on Apple devices. A change made anywhere on the page reaches
// every other user of the hook through a window event.
const MAPS_APP_KEY = 'slics-maps-app';
const MAPS_APP_EVENT = 'slics-maps-app';

export function useMapsApp() {
  const isAppleDevice = useAppleDevice();
  const [mapsApp, setMapsApp] = useState('google');

  // Read after mount so the server render and the first client render agree.
  useEffect(() => {
    if (!isAppleDevice) return undefined;
    const read = () => {
      try {
        setMapsApp(localStorage.getItem(MAPS_APP_KEY) === 'apple' ? 'apple' : 'google');
      } catch {
        // Storage blocked (private mode etc.): Google Maps.
      }
    };
    read();
    window.addEventListener(MAPS_APP_EVENT, read);
    return () => window.removeEventListener(MAPS_APP_EVENT, read);
  }, [isAppleDevice]);

  const chooseMapsApp = useCallback((app) => {
    setMapsApp(app);
    try {
      localStorage.setItem(MAPS_APP_KEY, app);
      window.dispatchEvent(new Event(MAPS_APP_EVENT));
    } catch {
      // Storage blocked: the choice lasts until reload, on this control only.
    }
  }, []);

  return { mapsApp, chooseMapsApp, isAppleDevice };
}
