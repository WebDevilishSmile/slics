// Per-device state for the "how was this stop?" comment prompt
// (comments/CommentPrompt.jsx). Lives in localStorage like the install nudge —
// a convenience only, so every read/write swallows storage errors (private
// mode etc.) and the prompt simply never shows.

const PENDING_KEY = 'slics-comment-prompt';
const SNOOZE_KEY = 'slics-comment-prompt-snoozed';

// A quick hop to Maps and straight back isn't a visit — the driver has to be
// gone at least MIN_AWAY_MS. Past MAX_AWAY_MS the stop is too stale to ask about.

// For testing purposes, the minimum away time is set to 1 second.
// export const MIN_AWAY_MS = 1 * 1000;

// 15 Minutes
export const MIN_AWAY_MS = 15 * 60 * 1000;
// 4 Hours
export const MAX_AWAY_MS = 4 * 60 * 60 * 1000;
const SNOOZE_MS = 14 * 24 * 60 * 60 * 1000;

const readPending = () => {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) ?? 'null');
  } catch {
    return null;
  }
};

const writePending = (entry) => {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(entry));
  } catch {
    // Storage blocked — no prompt on this device.
  }
};

const ageOf = (entry) => Date.now() - Date.parse(entry?.viewedAt ?? '');

// Called on every SLIC lookup. A repeat lookup of the same SLIC inside the
// window keeps the original entry: reopening the app on /home?slic=X re-tracks
// the view, and that must neither restart the 15-minute clock nor re-arm a
// prompt the driver already answered.
export function recordLookup(slic) {
  const pending = readPending();
  if (
    pending?.numSlic === String(slic.numSlic) &&
    ageOf(pending) < MAX_AWAY_MS
  ) {
    return;
  }
  writePending({
    numSlic: String(slic.numSlic),
    name: slic.name ?? null,
    // Drivers know centers by their alpha code; customers go by name alone.
    // No type counts as a center, as in home/SlicsSearch.jsx.
    alphaSlic:
      slic.type === 'center' || !slic.type ? (slic.alphaSlic ?? null) : null,
    viewedAt: new Date().toISOString(),
    prompted: false,
  });
}

const isSnoozed = () => {
  try {
    const snoozedAt = Date.parse(localStorage.getItem(SNOOZE_KEY) ?? '');
    return Date.now() - snoozedAt < SNOOZE_MS;
  } catch {
    return false;
  }
};

// The pending lookup if it's time to ask about it, otherwise null.
export function readDue() {
  const pending = readPending();
  if (!pending || pending.prompted || isSnoozed()) return null;
  const age = ageOf(pending);
  return age >= MIN_AWAY_MS && age <= MAX_AWAY_MS ? pending : null;
}

export function markPrompted() {
  const pending = readPending();
  if (pending) writePending({ ...pending, prompted: true });
}

export function snooze() {
  try {
    localStorage.setItem(SNOOZE_KEY, new Date().toISOString());
  } catch {
    // Storage blocked — nothing to snooze, the prompt can't show anyway.
  }
}
