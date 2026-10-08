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

const UNAVAILABLE = {
  code: 'unavailable',
  message: 'Could not read your location. Try again in a moment.',
};

const geolocationError = (geoError) =>
  geoError.code === geoError.PERMISSION_DENIED
    ? {
        code: 'denied',
        message:
          'Location access is blocked. Allow it for this site in your browser settings, then try again.',
      }
    : UNAVAILABLE;

const UNSUPPORTED = {
  code: 'unsupported',
  message: 'This device does not support location sharing.',
};

/**
 * Reads the browser's current position on demand. Deliberately not fired on
 * mount — the permission prompt should follow a deliberate tap, not a page load.
 *
 * - `request()` is quick: one reading, a cached one up to a minute old is
 *   fine. For sorting by distance. Resolves `{ lat, lng }`, or null on failure
 *   (and sets `error`).
 * - `requestPrecise()` is for dropping a pin. A phone's first reading is often
 *   a rough Wi-Fi or cell estimate, and GPS needs a few seconds, so it watches
 *   for up to `maxWait` ms with no cached fixes, keeps the most accurate
 *   reading, and stops early once one is within `goodEnough` meters (or
 *   when `stop()` is called). `accuracy` (meters) follows the best reading
 *   so far. Resolves
 *   `{ lat, lng, accuracy }`, or null on failure. On a computer every
 *   reading is a network estimate, so expect hundreds of feet.
 */
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const stopWatch = useRef(null);

  // A pin dialog closed mid-fix stops the GPS.
  useEffect(() => () => stopWatch.current?.(), []);

  const request = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError(UNSUPPORTED);
      return Promise.resolve(null);
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        ({ coords }) => {
          const next = { lat: coords.latitude, lng: coords.longitude };
          setPosition(next);
          setAccuracy(coords.accuracy);
          setLoading(false);
          resolve(next);
        },
        (geoError) => {
          setError(geolocationError(geoError));
          setLoading(false);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
      );
    });
  }, []);

  const requestPrecise = useCallback(
    ({ goodEnough = 10, maxWait = 15000 } = {}) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setError(UNSUPPORTED);
        return Promise.resolve(null);
      }

      stopWatch.current?.();
      setLoading(true);
      setError(null);
      setAccuracy(null);

      return new Promise((resolve) => {
        let best = null;
        let done = false;
        let watchId = null;

        const finish = (failure) => {
          if (done) return;
          done = true;
          navigator.geolocation.clearWatch(watchId);
          clearTimeout(timer);
          stopWatch.current = null;
          if (best) setPosition({ lat: best.lat, lng: best.lng });
          else if (failure) setError(failure);
          setLoading(false);
          resolve(best);
        };

        const timer = setTimeout(() => finish(UNAVAILABLE), maxWait);
        stopWatch.current = () => finish(null);

        watchId = navigator.geolocation.watchPosition(
          ({ coords }) => {
            if (best && coords.accuracy >= best.accuracy) return;
            best = {
              lat: coords.latitude,
              lng: coords.longitude,
              accuracy: coords.accuracy,
            };
            setAccuracy(coords.accuracy);
            if (coords.accuracy <= goodEnough) finish();
          },
          (geoError) => {
            // Once there's a reading, a failed refinement is ignored and the
            // timer ends the wait; a denial always stops it.
            if (best && geoError.code !== geoError.PERMISSION_DENIED) return;
            finish(geolocationError(geoError));
          },
          { enableHighAccuracy: true, maximumAge: 0, timeout: maxWait },
        );
      });
    },
    [],
  );

  // Ends a requestPrecise wait now, resolving with the best reading so far
  // ("Use this fix" in form/PinField.jsx).
  const stop = useCallback(() => stopWatch.current?.(), []);

  return { position, accuracy, error, loading, request, requestPrecise, stop };
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

// A short tap of haptic feedback (UI-SUGGESTIONS.md #51) on copy and vote.
// Only Android browsers implement the Vibration API (iOS Safari doesn't), so
// it's feature-detected and never relied on. Silent under reduced motion.
export function tapHaptic(ms = 10) {
  if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  try {
    navigator.vibrate(ms);
  } catch {
    // Some browsers throw if vibration is blocked; feedback is optional.
  }
}
