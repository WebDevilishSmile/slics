'use client';

import { useCallback, useEffect, useState } from 'react';

import { apiRequest } from '@/lib/apiRequest';
import { PUSH_SUBSCRIPTIONS_URL as SUBSCRIPTIONS_URL, removeThisDevice } from '@/lib/pushDevice';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// The VAPID public key (base64url) as the bytes pushManager.subscribe takes.
function keyBytes(base64url) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

// Whether a subscription was made with this server's public key. One made with
// an old key (after a rotation) can't be sent to, and blocks subscribing anew.
function madeWithKey(subscription, key) {
  const current = subscription.options?.applicationServerKey;
  if (!current) return true;
  const ours = keyBytes(key);
  const theirs = new Uint8Array(current);
  return theirs.length === ours.length && theirs.every((byte, i) => byte === ours[i]);
}

const isSupported = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

// iOS only offers push to the app added to the home screen, never in a tab.
function needsInstall() {
  const isIos =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  return isIos && !standalone;
}

// The registration enable() made, without registering one: a driver who never
// turns notifications on never downloads the service worker.
const getRegistration = () => navigator.serviceWorker.getRegistration('/');

/**
 * Push notifications on this device (docs/PUSH-NOTIFICATIONS.md).
 *
 * `state` is null until checked, then one of:
 *   'unsupported'   this browser can't do push (or the server has no key)
 *   'needs-install' an iPhone outside the home-screen app
 *   'blocked'       the driver said "Don't Allow"; only the phone's settings undo it
 *   'off' | 'on'
 *
 * `enable()` must run inside a tap: it asks for permission first, while the
 * tap still counts, then registers public/sw.js, subscribes and saves the
 * subscription. `disable()` unsubscribes, deletes it and unregisters the
 * worker, so nothing is left behind (removeThisDevice, lib/pushDevice.js, which
 * signing out uses too). Both resolve `{ error }` on failure.
 */
export function usePushNotifications() {
  const [state, setState] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!PUBLIC_KEY || !isSupported()) {
        setState(needsInstall() ? 'needs-install' : 'unsupported');
        return;
      }
      if (Notification.permission === 'denied') {
        setState('blocked');
        return;
      }
      const registration = await getRegistration().catch(() => null);
      const subscription = await registration?.pushManager.getSubscription().catch(() => null);
      const on =
        Boolean(subscription) && Notification.permission === 'granted' && madeWithKey(subscription, PUBLIC_KEY);
      if (cancelled) return;
      setState(on ? 'on' : 'off');
      // Re-save it, so a row the server dropped (or another account's, on a
      // shared device) matches this device again. Quietly: it's on either way.
      if (on) apiRequest(SUBSCRIPTIONS_URL, { body: subscription.toJSON() });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      await removeThisDevice();
      setState(Notification.permission === 'denied' ? 'blocked' : 'off');
      return {};
    } catch (error) {
      console.error('Error turning off notifications:', error);
      return { error: "Couldn't turn off notifications. Please try again." };
    } finally {
      setBusy(false);
    }
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    let registration = null;
    try {
      // First, while the tap still counts: iOS only asks inside one.
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return {};
      }

      await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
      registration = await navigator.serviceWorker.ready;

      let subscription = await registration.pushManager.getSubscription();
      if (subscription && !madeWithKey(subscription, PUBLIC_KEY)) {
        await subscription.unsubscribe();
        subscription = null;
      }
      subscription ??= await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(PUBLIC_KEY),
      });

      const { error } = await apiRequest(SUBSCRIPTIONS_URL, { body: subscription.toJSON() });
      if (error) {
        await subscription.unsubscribe().catch(() => {});
        await registration.unregister().catch(() => {});
        setState('off');
        return { error };
      }
      setState('on');
      return {};
    } catch (error) {
      console.error('Error turning on notifications:', error);
      await registration?.unregister().catch(() => {});
      setState(Notification.permission === 'denied' ? 'blocked' : 'off');
      return { error: "Couldn't turn on notifications on this device." };
    } finally {
      setBusy(false);
    }
  }, []);

  return { state, busy, enable, disable };
}
