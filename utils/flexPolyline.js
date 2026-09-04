/**
 * HERE Flexible Polyline encoding / decoding.
 *
 * Ported from HERE's reference implementation (MIT licensed):
 * https://github.com/heremaps/flexible-polyline
 *
 * We need this because the HERE Routing API returns route geometry as a
 * flexible polyline, and the Geocoding & Search corridor filter caps the
 * polyline it accepts. Decoding lets us downsample a long route before
 * asking for stops along it.
 */

const ENCODING_TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

// prettier-ignore
const DECODING_TABLE = [
  62, -1, -1, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
  -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, -1, -1, -1, -1, 63, -1, 26, 27, 28, 29, 30, 31, 32,
  33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51,
];

const FORMAT_VERSION = 1;

function decodeChar(char) {
  const charCode = char.charCodeAt(0);
  return DECODING_TABLE[charCode - 45];
}

function decodeUnsignedValues(encoded) {
  let result = 0;
  let shift = 0;
  const values = [];

  for (const char of encoded) {
    const value = decodeChar(char);
    if (value === undefined || value < 0) {
      throw new Error('Invalid character in flexible polyline');
    }

    result |= (value & 0x1f) << shift;

    if ((value & 0x20) === 0) {
      values.push(result);
      result = 0;
      shift = 0;
    } else {
      shift += 5;
    }
  }

  return values;
}

function decodeHeader(version, encodedHeader) {
  if (version !== FORMAT_VERSION) {
    throw new Error(`Unsupported flexible polyline version: ${version}`);
  }

  return {
    precision: encodedHeader & 15,
    thirdDim: (encodedHeader >> 4) & 7,
    thirdDimPrecision: (encodedHeader >> 7) & 15,
  };
}

function toSigned(value) {
  let result = value;
  if (result & 1) result = ~result;
  result >>= 1;
  return result;
}

/**
 * @param {string} encoded flexible polyline string
 * @returns {Array<[number, number]>} [lat, lng] pairs (any third dimension is dropped)
 */
export function decode(encoded) {
  const values = decodeUnsignedValues(encoded);
  const { precision, thirdDim } = decodeHeader(values[0], values[1]);

  const factor = 10 ** precision;
  const stride = thirdDim ? 3 : 2;

  const points = [];
  let lat = 0;
  let lng = 0;

  for (let i = 2; i + 1 < values.length; i += stride) {
    lat += toSigned(values[i]);
    lng += toSigned(values[i + 1]);
    points.push([lat / factor, lng / factor]);
  }

  return points;
}

function encodeUnsignedNumber(value) {
  let result = '';
  let remaining = value;

  while (remaining > 0x1f) {
    result += ENCODING_TABLE[(remaining & 0x1f) | 0x20];
    remaining >>= 5;
  }

  return result + ENCODING_TABLE[remaining];
}

function encodeScaledValue(value) {
  const negative = value < 0;
  let scaled = value << 1;
  if (negative) scaled = ~scaled;
  return encodeUnsignedNumber(scaled);
}

/**
 * @param {Array<[number, number]>} points [lat, lng] pairs
 * @param {number} precision decimal places to keep (5 is ~1m, plenty for a corridor)
 * @returns {string} flexible polyline string
 */
export function encode(points, precision = 5) {
  const multiplier = 10 ** precision;
  let result = encodeUnsignedNumber(FORMAT_VERSION) + encodeUnsignedNumber(precision);

  let lastLat = 0;
  let lastLng = 0;

  for (const [latitude, longitude] of points) {
    const lat = Math.round(latitude * multiplier);
    result += encodeScaledValue(lat - lastLat);
    lastLat = lat;

    const lng = Math.round(longitude * multiplier);
    result += encodeScaledValue(lng - lastLng);
    lastLng = lng;
  }

  return result;
}

/**
 * Evenly thins any ordered list down to at most max entries, always keeping
 * the first and last so the result still spans the whole original range.
 */
export function sampleEvenly(items, max) {
  if (items.length <= max) return items;

  const step = (items.length - 1) / (max - 1);
  const sampled = [];

  for (let i = 0; i < max; i += 1) {
    sampled.push(items[Math.round(i * step)]);
  }

  return sampled;
}
