// Creator mode (docs/CREATOR-MODE.md): the super admin's switch for recording
// videos. With it on, the lookup screen (/home, /hubs) shows made-up SLICs and
// tips instead of real ones, and the menu shows a made-up driver. Import-free,
// so the server (lib/authz.js getCreatorMode) and the browser share it.

// A per-device cookie, so the server knows to render the made-up data. It
// only ever swaps real data for made-up data, so it isn't trusted for
// anything: the server also requires a super admin (getCreatorMode).
export const CREATOR_COOKIE = 'slics-creator';

// It turns itself off after a shift, so a switch left on never shows a driver
// made-up SLICs the next day.
export const CREATOR_COOKIE_MAX_AGE = 12 * 60 * 60; // seconds

export function setCreatorCookie(on) {
  const value = on ? `1; Max-Age=${CREATOR_COOKIE_MAX_AGE}` : '; Max-Age=0';
  document.cookie = `${CREATOR_COOKIE}=${value}; Path=/; SameSite=Lax`;
}

// True while the made-up data is on screen in this tab (set by
// lib/creatorFetch.js). The per-device lists in localStorage (recent lookups,
// tips seen, the comment prompt) keep a separate copy meanwhile, so made-up
// SLICs never land in the real ones.
let active = false;

export function setCreatorActive(on) {
  active = on;
}

export const isCreatorActive = () => active;

export const creatorStorageKey = (key) => (active ? `${key}:creator` : key);
