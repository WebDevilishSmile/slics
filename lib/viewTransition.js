'use client';

import { flushSync } from 'react-dom';

// Runs a React state update inside a same-document View Transition
// (UI-SUGGESTIONS.md #48), so elements with a `viewTransitionName` animate
// between the old and new render. The update must be synchronous; flushSync
// makes React commit it inside the browser's callback, which is when the new
// state is captured.
//
// Progressive enhancement: browsers without View Transitions (and anyone who
// prefers reduced motion) just get the update, applied immediately.
export function withViewTransition(update) {
  const supported =
    typeof document !== 'undefined' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!supported) {
    update();
    return;
  }
  const transition = document.startViewTransition(() => flushSync(update));
  // A transition started while another runs skips the older one, whose
  // `ready` then rejects ("Transition was skipped"). The update itself still
  // lands, so there's nothing to handle. Quick Back/Forward on /home does it
  // now that lookups don't wait for the server (lib/lookupUrl.js).
  transition.ready.catch(() => {});
}
