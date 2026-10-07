// Coordinate helpers for the Planet Fitness page (/admin/planet-fitness) and
// Whip It In & Out (/whip-it-in-and-out). Pure functions with no browser or
// Node APIs, so both the client components and the server-side validation in
// utils/gymsApi.js and utils/placesApi.js import them.

const EARTH_RADIUS_MILES = 3958.8;

// "lat, lng" with optional spaces, e.g. "40.273210, -76.886710".
const PAIR = '(-?\\d{1,3}(?:\\.\\d+)?)\\s*,\\s*(-?\\d{1,3}(?:\\.\\d+)?)';

// Tried in order. A Google Maps place URL carries both the map's viewport
// center (`@lat,lng`) and the place itself (`!3d<lat>!4d<lng>`), so the
// place pin wins; a bare pair is what Maps copies after a long-press.
const PATTERNS = [
  /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
  new RegExp(`[?&](?:q|query|ll|destination)=${PAIR}`),
  new RegExp(`@${PAIR}`),
  new RegExp(`^${PAIR}$`),
];

export function isValidLatLng(point) {
  return (
    Number.isFinite(point?.lat) &&
    Number.isFinite(point?.lng) &&
    Math.abs(point.lat) <= 90 &&
    Math.abs(point.lng) <= 180
  );
}

// Reads a pasted pin: coordinates or a Google Maps link. Returns
// `{ lat, lng }` (6 decimals, ~10cm) or null when nothing usable is found.
export function parseLatLng(text) {
  if (typeof text !== 'string') return null;

  let input = text.trim();
  try {
    input = decodeURIComponent(input); // %2C in shared links
  } catch {
    // Not URI-encoded; use as-is.
  }

  for (const pattern of PATTERNS) {
    const match = input.match(pattern);
    if (!match) continue;
    const point = {
      lat: Number(Number(match[1]).toFixed(6)),
      lng: Number(Number(match[2]).toFixed(6)),
    };
    if (isValidLatLng(point)) return point;
  }
  return null;
}

// "lat, lng" at 6 decimals — the inverse of parseLatLng, and the same shape
// Google Maps copies, so a GPS fix reads like a pasted pin.
export function formatLatLng(point) {
  return `${Number(point.lat.toFixed(6))}, ${Number(point.lng.toFixed(6))}`;
}

// Straight-line (haversine) distance — not road miles.
export function distanceMiles(a, b) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(h));
}

// Maps link for a place with a `parking` pin and/or an `address`. The pin wins
// so navigation ends at the truck parking, not the front door. Also builds the
// SLIC map buttons (home/MapPhoneLinks.jsx), which pass just `{ address }`.
export function mapsHref({ name, address, parking }, provider = 'google') {
  if (parking) {
    const ll = `${parking.lat},${parking.lng}`;
    return provider === 'apple'
      ? `https://maps.apple.com/?ll=${ll}&q=${encodeURIComponent(name || 'Parking')}`
      : `https://www.google.com/maps/search/?api=1&query=${ll}`;
  }

  const query = encodeURIComponent(
    [address?.street, address?.city, address?.state, address?.zip]
      .filter(Boolean)
      .join(', '),
  );
  return provider === 'apple'
    ? `https://maps.apple.com/?q=${query}`
    : `https://www.google.com/maps/search/?api=1&query=${query}`;
}
