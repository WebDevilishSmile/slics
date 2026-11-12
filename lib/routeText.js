// A route's text and a SLIC's arrival notes (docs/SLIC-DIRECTIONS.md, stage 1).
// Pure and import-free, so the directions sheet, the print page, the admin
// editor, the API and the import script (plain Node) read them the same way.
//
// A route is plain text, never HTML (SECURITY.md #2), one step per line. A
// line ending in ':' starts a section ("Way 2 (easier):", "Way back:", "From
// Burtonsville, MD:"), and each section's steps are numbered on their own.
// Blank lines don't count.

// A hub's route to a SLIC (`slic-routes`) and the SLIC's own arrival notes
// (`slics.arrival`, shared by every hub). The longest of the 65 PDFs the
// routes replace is about 2,900 characters, its way back included.
export const ROUTE_TEXT_MAX_LENGTH = 6000;
export const ARRIVAL_MAX_LENGTH = 2000;
// Earlier versions a route keeps (`previous`), newest first.
export const ROUTE_VERSIONS_KEPT = 20;
// A driver's note with a suggested route ("why it's better or truck-safe"),
// and an admin's answer when declining one (`route-suggestions`).
export const ROUTE_NOTE_MAX_LENGTH = 500;

const HEADING_MAX_LENGTH = 80;

// Windows line endings, stray spaces at either end of a line, and runs of
// blank lines are tidied; nothing else changes.
export function normalizeRouteText(text) {
  return String(text ?? '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

const isHeading = (line) => line.endsWith(':') && line.length <= HEADING_MAX_LENGTH;

// → [{ title, steps }]. `title` is null for steps before the first heading,
// and a heading with no steps under it is dropped.
export function parseRoute(text) {
  const sections = [];
  let current = { title: null, steps: [] };
  for (const line of normalizeRouteText(text).split('\n')) {
    if (!line) continue;
    if (isHeading(line)) {
      if (current.steps.length) sections.push(current);
      current = { title: line.slice(0, -1).trim(), steps: [] };
    } else {
      current.steps.push(line);
    }
  }
  if (current.steps.length) sections.push(current);
  return sections;
}

// A section's tab label: its heading, or "Route" for the steps before any.
export const sectionLabel = (section) => section.title || 'Route';

// A route's date as drivers read it ("Nov 12, 2026"), in the hub's time zone.
export const formatRouteDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'America/New_York',
      })
    : null;

// Where a route's steps came from: the old PDF's text as it was, or a route
// an admin saved (approved) on a date.
export function routeSourceLine(route) {
  if (route.source === 'pdf-import') return 'From the original directions PDF.';
  const date = formatRouteDate(route.approvedAt);
  return date ? `Driver-approved route · approved ${date}` : 'Driver-approved route';
}

// A step as it should be spoken (Read aloud): the road abbreviations drivers
// write, said in full, and "/" as a pause rather than "slash".
const SPOKEN = [
  [/\bRte?\.?(?=\s)/g, 'Route'],
  [/\bRd\b\.?/g, 'Road'],
  [/\bAve\b\.?/g, 'Avenue'],
  [/\bBlvd\b\.?/g, 'Boulevard'],
  [/\bPkwy\b\.?/g, 'Parkway'],
  [/\bExpw?y\b\.?/g, 'Expressway'],
  [/\bHwy\b\.?/g, 'Highway'],
  [/\bLn\b\.?/g, 'Lane'],
  [/\bDr\b\.?/g, 'Drive'],
  [/\s*\/\s*/g, ', '],
];
export function spokenText(step) {
  return SPOKEN.reduce((text, [pattern, word]) => text.replace(pattern, word), String(step ?? ''));
}

// A run of digits after "code", "passcode" or "PIN": a gate code doesn't
// belong in a route anyone signed in can read (ROUTE-REVIEW.md → Do first).
// The editor warns; it doesn't block, since "exit code 7" isn't one.
export function mentionsCode(text) {
  return /\b(pass\s*code|passcode|code|pin)\b[^\n]{0,20}?\d{3,}/i.test(String(text ?? ''));
}

// → { text } or { error }. A route can't be empty: deleting is its own action.
export function validateRouteText(value) {
  if (typeof value !== 'string') return { error: 'Write the route.' };
  const text = normalizeRouteText(value);
  if (!text) return { error: 'Write the route.' };
  if (text.length > ROUTE_TEXT_MAX_LENGTH) {
    return { error: `Keep the route under ${ROUTE_TEXT_MAX_LENGTH.toLocaleString()} characters.` };
  }
  if (!parseRoute(text).length) return { error: 'The route needs at least one step.' };
  return { text };
}

// → { arrival } (null when blank) or { error }.
export function validateArrival(value) {
  if (value == null) return { arrival: null };
  if (typeof value !== 'string') return { error: 'Arrival notes must be text.' };
  const arrival = normalizeRouteText(value);
  if (arrival.length > ARRIVAL_MAX_LENGTH) {
    return { error: `Keep the arrival notes under ${ARRIVAL_MAX_LENGTH.toLocaleString()} characters.` };
  }
  return { arrival: arrival || null };
}
