'use client';

import { useSyncExternalStore } from 'react';

// Tip counts for the SLIC on screen, shared between the comments section
// (comments/Comments.jsx, which loads the thread and knows what's new) and the
// lookup card's Tips button (home/SlicActions.jsx). They render in different
// trees, so a tiny module store beats threading a context through /home.
let state = { numSlic: null, total: null, newCount: 0 };
const listeners = new Set();

export function setTips(next) {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const getSnapshot = () => state;
const getServerSnapshot = () => ({ numSlic: null, total: null, newCount: 0 });

// The counts for `numSlic`, or null until the comments section has loaded it.
export function useTips(numSlic) {
  const tips = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return tips.numSlic === numSlic ? tips : null;
}

// "New since you last looked", per device: numSlic → ISO time the tips were
// last on screen. Per-viewer convenience only, like the install nudge, so
// storage failures just mean no badges.
const SEEN_KEY = 'slics-tips-seen';

export function readTipsSeen(numSlic) {
  try {
    return JSON.parse(localStorage.getItem(SEEN_KEY) || '{}')[numSlic] ?? null;
  } catch {
    return null;
  }
}

export function writeTipsSeen(numSlic, iso = new Date().toISOString()) {
  try {
    const seen = JSON.parse(localStorage.getItem(SEEN_KEY) || '{}');
    seen[numSlic] = iso;
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen));
  } catch {
    // Storage blocked (private mode etc.).
  }
}
