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
