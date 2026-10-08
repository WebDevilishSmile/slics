// The SLICs this device looked up most recently, newest first, for the /home
// empty state's "Recent" chips (UI-SUGGESTIONS.md #44; #42 can reuse it for the
// search). Per-device convenience in localStorage, like the install nudge, so
// every read/write swallows storage errors and the list is just empty.

const KEY = 'slics-recent-lookups';
const MAX = 6;

export function readRecentLookups() {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// Called on every lookup (home/Main.jsx). Centers are labeled by their alpha
// code, customers by their name, as on the lookup card.
export function recordRecentLookup(slic) {
  const isCustomer = slic.type === 'customer';
  const entry = {
    numSlic: String(slic.numSlic),
    label: (isCustomer ? slic.name : slic.alphaSlic) || `SLIC ${slic.numSlic}`,
    type: isCustomer ? 'customer' : 'center',
  };
  const list = [
    entry,
    ...readRecentLookups().filter((item) => item.numSlic !== entry.numSlic),
  ].slice(0, MAX);
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // Storage blocked (private mode etc.).
  }
}
