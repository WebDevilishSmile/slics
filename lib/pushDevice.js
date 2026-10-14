import { apiRequest } from '@/lib/apiRequest';

// Turning push notifications off on this device (docs/PUSH-NOTIFICATIONS.md):
// the switch on /profile (hooks/usePushNotifications.js), signing out
// (header/UserMenu.jsx) and deleting the account (profile/DeleteAccountDialog.jsx).
// It never registers anything: a device that never turned notifications on
// has no registration, and this does nothing there.

export const PUSH_SUBSCRIPTIONS_URL = '/api/users/me/push-subscriptions';

// Sign-out waits at most this long, so a slow network never holds it up.
const SIGN_OUT_WAIT_MS = 3000;

// Deletes this device's row, unsubscribes and unregisters the service worker.
// Throws if the browser does, for the /profile switch to say so.
export async function removeThisDevice() {
  const registration = await navigator.serviceWorker.getRegistration('/');
  if (!registration) return;
  const subscription = await registration.pushManager?.getSubscription();
  if (subscription) {
    // The server row goes first, while the endpoint is still known and the
    // session still exists. If that fails, the push service answers 410 on
    // the next send and lib/push.js deletes the row then.
    await apiRequest(PUSH_SUBSCRIPTIONS_URL, {
      method: 'DELETE',
      body: { endpoint: subscription.endpoint },
    });
    await subscription.unsubscribe();
  }
  await registration.unregister();
}

// The same before signing out: never throws, and gives up after
// SIGN_OUT_WAIT_MS so the sign-out goes ahead offline too.
export async function turnOffThisDevice() {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  let timer;
  try {
    await Promise.race([
      removeThisDevice(),
      new Promise((resolve) => {
        timer = setTimeout(resolve, SIGN_OUT_WAIT_MS);
      }),
    ]);
  } catch (error) {
    console.error('Error turning off notifications on sign-out:', error);
  } finally {
    clearTimeout(timer);
  }
}
