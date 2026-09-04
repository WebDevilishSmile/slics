import { decode, encode, sampleEvenly } from '@/utils/flexPolyline';

const GEOCODE_URL = 'https://geocode.search.hereapi.com/v1/geocode';
const ROUTING_URL = 'https://router.hereapi.com/v8/routes';
const BROWSE_URL = 'https://browse.search.hereapi.com/v1/browse';

const METERS_PER_MILE = 1609.344;

/**
 * Standard tractor-trailer. HERE wants centimeters for dimensions and
 * kilograms for weights.
 */
export const TRUCK_PROFILE = {
  height: 412, // 13'6"
  width: 260, // 8'6"
  length: 2200, // 53' trailer + tractor
  grossWeight: 36287, // 80,000 lb
  weightPerAxle: 9072, // 20,000 lb
  axleCount: 5,
  trailerCount: 1,
};

/**
 * Where a driver can legally stop. These are leaf category IDs verified
 * against live HERE responses — the parent IDs from the category docs
 * (400-4300-0000, 700-7600-0000) match nothing.
 */
const STOP_CATEGORIES = [
  '700-7900-0132', // Truck Stop - Plaza
  '700-7900-0131', // Truck Parking
  '400-4300-0200', // Parking and Restroom-only Rest Area
  '400-4200-0048', // Weigh Station
];

// The along-route filter caps the polyline it accepts and the whole URL has
// to stay under 2048 bytes, so long routes get thinned first. 120 points
// keeps a coast-to-coast corridor near 700 characters.
const MAX_CORRIDOR_POINTS = 120;
const CORRIDOR_WIDTH_METERS = 1500;
// HERE ranks nearest-first, so ask for plenty and spread them out ourselves.
const STOP_FETCH_LIMIT = 100;
const MAX_STOPS_RETURNED = 30;

function getApiKey() {
  const apiKey = process.env.HERE_API_KEY;

  if (!apiKey) {
    throw new Error(
      'HERE_API_KEY is not set. Add it to .env to enable route lookups.'
    );
  }

  return apiKey;
}

async function hereFetch(url, label) {
  const response = await fetch(url, { cache: 'no-store' });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`HERE ${label} failed (${response.status}): ${body}`);
  }

  return response.json();
}

export async function geocodeAddress(address) {
  if (!address?.street || !address?.city) {
    throw new Error('Address must include at least a street and city');
  }

  const query = [
    address.street,
    address.city,
    [address.state, address.zip].filter(Boolean).join(' '),
  ]
    .filter(Boolean)
    .join(', ');

  const params = new URLSearchParams({
    q: query,
    in: 'countryCode:USA',
    limit: '1',
    apiKey: getApiKey(),
  });

  const data = await hereFetch(`${GEOCODE_URL}?${params}`, 'geocode');
  const match = data.items?.[0];

  if (!match?.position) {
    throw new Error(`Could not find coordinates for "${query}"`);
  }

  return {
    lat: match.position.lat,
    lng: match.position.lng,
    resolvedAddress: match.address?.label || query,
  };
}

export async function getTruckRoute({ origin, destination }) {
  const params = new URLSearchParams({
    transportMode: 'truck',
    origin: `${origin.lat},${origin.lng}`,
    destination: `${destination.lat},${destination.lng}`,
    return: 'summary,polyline,actions,instructions',
    // v8 wants an ISO timestamp here; omitting it disables live traffic.
    departureTime: new Date().toISOString(),
    'avoid[features]': 'dirtRoad',
    apiKey: getApiKey(),
  });

  for (const [key, value] of Object.entries(TRUCK_PROFILE)) {
    params.set(`vehicle[${key}]`, String(value));
  }

  const data = await hereFetch(`${ROUTING_URL}?${params}`, 'routing');

  if (!data.routes?.length) {
    throw new Error('HERE returned no truck route for this origin/destination');
  }

  return data.routes[0];
}

/**
 * Rest stops and fuel along the corridor. Deliberately never throws — a
 * corridor miss should not take the ETA panel down with it.
 */
export async function findStopsAlongRoute(polylines, origin) {
  try {
    const points = (polylines || []).flatMap((polyline) => decode(polyline));
    if (points.length < 2) return [];

    const corridor = encode(sampleEvenly(points, MAX_CORRIDOR_POINTS));

    const params = new URLSearchParams({
      at: `${origin.lat},${origin.lng}`,
      route: `${corridor};w=${CORRIDOR_WIDTH_METERS}`,
      categories: STOP_CATEGORIES.join(','),
      limit: String(STOP_FETCH_LIMIT),
      apiKey: getApiKey(),
    });

    const data = await hereFetch(`${BROWSE_URL}?${params}`, 'browse');

    // The same rest area often comes back once per matching category, so
    // collapse anything sharing a name within ~100m.
    const seen = new Set();
    const stops = [];

    for (const item of data.items || []) {
      const key = `${item.title}|${item.position?.lat.toFixed(3)},${item.position?.lng.toFixed(3)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      stops.push({
        title: item.title,
        category: item.categories?.find((c) => c.primary)?.name || null,
        address: item.address?.label || null,
        distanceMeters: item.distance ?? null,
        distanceMiles:
          item.distance != null
            ? Number((item.distance / METERS_PER_MILE).toFixed(1))
            : null,
        position: item.position || null,
      });
    }

    return sampleEvenly(stops, MAX_STOPS_RETURNED);
  } catch (error) {
    console.error('Error finding stops along route:', error);
    return [];
  }
}

export function summarizeRoute(route) {
  const sections = route.sections || [];

  let distanceMeters = 0;
  let durationSeconds = 0;
  let baseDurationSeconds = 0;
  const notices = [];
  const steps = [];
  const polylines = [];

  for (const section of sections) {
    if (section.polyline) polylines.push(section.polyline);

    distanceMeters += section.summary?.length || 0;
    durationSeconds += section.summary?.duration || 0;
    baseDurationSeconds +=
      section.summary?.baseDuration ?? section.summary?.duration ?? 0;

    for (const notice of section.notices || []) {
      // notice.title is generic ("Violated vehicle restriction."); the useful
      // text for a driver is in details[].cause ("height limit of 381 cm").
      const causes = (notice.details || [])
        .map((detail) => detail.cause)
        .filter(Boolean);

      notices.push({
        title: notice.title,
        code: notice.code,
        severity: notice.severity,
        causes,
      });
    }

    for (const action of section.actions || []) {
      if (!action.instruction) continue;
      steps.push({
        instruction: action.instruction,
        distanceMeters: action.length || 0,
        durationSeconds: action.duration || 0,
      });
    }
  }

  const arrival = sections[sections.length - 1]?.arrival?.time;

  // The same restriction is often reported by consecutive sections.
  const seenNotices = new Set();
  const uniqueNotices = notices.filter((notice) => {
    const key = `${notice.code}|${notice.causes.join('|')}`;
    if (seenNotices.has(key)) return false;
    seenNotices.add(key);
    return true;
  });

  return {
    distanceMeters,
    distanceMiles: Number((distanceMeters / METERS_PER_MILE).toFixed(1)),
    durationSeconds,
    trafficDelaySeconds: Math.max(0, durationSeconds - baseDurationSeconds),
    arrivalTime:
      arrival || new Date(Date.now() + durationSeconds * 1000).toISOString(),
    notices: uniqueNotices,
    steps,
    polylines,
  };
}
