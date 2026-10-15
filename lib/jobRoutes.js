import { DAY_FIELDS } from '@/lib/dayFormat';

// A job's description as the on-call sheet writes it: day labels, each with
// the route that day, "MON-FRI: BETPA>BURMD>GAIMD  SAT: BETPA>ALLPA". Labels
// are one day ("TUE:"), a range ("MON-FRI:", "TUE-SAT:") or a list ("MON,
// THU:"), in any case, with TUES/THUR/THURS spellings. No imports beyond the
// day names, so client and server both use it (the profile's This week card).

const DAY_WORD = '(?:SUN|MON|TUES?|WED|THU(?:RS?)?|FRI|SAT)(?:DAY)?';
const LABEL = new RegExp(`\\b(${DAY_WORD}(?:\\s*[-,&/]\\s*${DAY_WORD})*)\\s*:`, 'gi');
const DAY_TOKEN = new RegExp(DAY_WORD, 'gi');

const dayOf = (word) => DAY_FIELDS.find((day) => word.toLowerCase().startsWith(day)) ?? null;

// "MON-FRI" → mon…fri, "MON, THU" → mon, thu, "FRI-MON" wraps the weekend.
function daysOfLabel(label) {
  const days = [];
  const words = label.match(DAY_TOKEN) ?? [];
  const separators = label.split(DAY_TOKEN).slice(1, -1).map((sep) => sep.trim());
  words.forEach((word, index) => {
    const day = dayOf(word);
    if (!day) return;
    if (index > 0 && separators[index - 1] === '-' && days.length > 0) {
      const from = DAY_FIELDS.indexOf(days[days.length - 1]);
      const to = DAY_FIELDS.indexOf(day);
      for (let step = 1; step <= (to - from + 7) % 7; step += 1) {
        days.push(DAY_FIELDS[(from + step) % 7]);
      }
    } else {
      days.push(day);
    }
  });
  return days;
}

// → { sun: 'BETPA>BURMD', … } for the days the description names, or null
// when it isn't written with day labels (the page shows it as written then).
// A day named twice keeps its first route.
export function routesByDay(description) {
  const text = String(description ?? '');
  const labels = [...text.matchAll(LABEL)];
  if (labels.length === 0 || text.slice(0, labels[0].index).trim() !== '') return null;

  const routes = {};
  labels.forEach((match, index) => {
    const end = index + 1 < labels.length ? labels[index + 1].index : text.length;
    const route = text
      .slice(match.index + match[0].length, end)
      .trim()
      .replace(/[\s,;]+$/, '');
    for (const day of daysOfLabel(match[1])) {
      if (!(day in routes)) routes[day] = route;
    }
  });
  return Object.keys(routes).length > 0 ? routes : null;
}

// A route's stops, in order: "BETPA>BURMD > GAIMD" → ['BETPA', 'BURMD',
// 'GAIMD']. Text with no ">" (a shifter's "YARD/SHUTTLE") is one stop.
export function routeStops(route) {
  return String(route ?? '')
    .split('>')
    .map((stop) => stop.trim())
    .filter(Boolean);
}

// The form a stop is matched against a SLIC's alpha code by: upper case,
// letters and digits only.
export const stopKey = (stop) => String(stop ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
