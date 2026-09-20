'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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

/**
 * Whether — and how — the app can be added to the home screen.
 *
 * `platform` is 'native' where the browser exposes an install prompt
 * (Chrome/Edge on Android and desktop): `promptInstall()` opens it. It is
 * 'ios' on iPhone/iPad, where the only path is Safari's Share → "Add to Home
 * Screen", so callers show instructions instead. It stays null when the page
 * is already running as the installed app or the browser offers neither.
 *
 * Chrome's `beforeinstallprompt` can fire before React hydrates, so
 * app/layout.jsx stashes it on `window.__slicsInstallPrompt`; the event can
 * be prompted only once, which is why it lives in a ref and is cleared after.
 */
export function useInstallPrompt() {
  const [platform, setPlatform] = useState(null);
  const [installed, setInstalled] = useState(false);
  const promptEvent = useRef(null);

  useEffect(() => {
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (standalone) {
      setInstalled(true);
      return;
    }

    // iPadOS reports itself as a Mac; the touch-point check tells them apart.
    const isIos =
      /iphone|ipad|ipod/i.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (isIos) setPlatform('ios');

    if (window.__slicsInstallPrompt) {
      promptEvent.current = window.__slicsInstallPrompt;
      setPlatform('native');
    }

    const handleBeforeInstall = (event) => {
      event.preventDefault();
      promptEvent.current = event;
      window.__slicsInstallPrompt = event;
      setPlatform('native');
    };
    const handleInstalled = () => {
      promptEvent.current = null;
      window.__slicsInstallPrompt = null;
      setInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    const event = promptEvent.current;
    if (!event) return null;
    promptEvent.current = null;
    window.__slicsInstallPrompt = null;

    event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      setInstalled(true);
    } else {
      // Chrome won't re-fire beforeinstallprompt this page load; the browser
      // menu still offers install, so just hide the in-app entry.
      setPlatform(null);
    }
    return outcome;
  }, []);

  return {
    canInstall: !installed && platform !== null,
    platform,
    promptInstall,
  };
}
