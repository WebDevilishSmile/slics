import { coverSpots } from '@/lib/coverDrivers';
import {
  driverLastName,
  driverNameKey,
  nameMatchScore,
  sameDriverName,
} from '@/lib/driverNames';

// The drivers list on /admin/drivers: the on-call sheet merged with the
// `drivers` roster. The sheet leads (it's kept current); the roster fills in
// what the sheet doesn't have. Pure, so the merge can be checked on made-up
// rows.
//
// - Sheet drivers are everyone with a job on the Jobs tab (name, seniority
//   rank, job) and everyone on a cover tab from the last few weeks who has no
//   job (their place on the latest one).
// - A roster row (employee ID, seniority date `YYYY-MM-DD-A`, phone) is linked
//   to a sheet driver by an admin (`sheetKey`), or automatically when the
//   names have the same words. The rest get a suggestion an admin confirms or
//   turns down (`notSheetKeys`). One roster row per driver, either way.
// - The list is in seniority order: dated drivers by their roster date (+
//   letter), drivers with no date yet at their sheet rank among them, then
//   drivers with neither. Rank and date agree (checked 2026-10-10) except
//   where a link or a date is wrong; those rows are flagged (`dateFitsRank`)
//   and don't move anyone else (see "Where each driver goes" below).

// How far back cover tabs count as current, here and for the sheet names an
// admin picks from on /admin/driver-claims.
export const PICK_WEEKS_BACK = 8;

// The oldest week ending that counts, as 'YYYY-MM-DD'.
export function pickWeeksSince(now = Date.now()) {
  return new Date(now - PICK_WEEKS_BACK * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

const cleanName = (value) => String(value ?? '').replace(/\s+/g, ' ').trim();
// Plain character order, not the locale's, for 'YYYY-MM-DD-A' dates.
const byText = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
const rankOf = (value) => {
  const text = String(value ?? '').trim();
  return /^\d+$/.test(text) ? Number(text) : null;
};

// A suggestion needs a close name, or a fair one with the same last name.
const SURE = 0.75;
const LIKELY = 0.5;

function sheetDrivers(jobs, coverWeeks) {
  const byKey = new Map();
  for (const job of jobs) {
    const name = cleanName(job.driver);
    const key = driverNameKey(name);
    if (!key || byKey.has(key)) continue;
    byKey.set(key, { key, name, rank: rankOf(job.seniority), job: job.jobName ?? null, cover: null });
  }
  // Newest week first, so a cover driver shows where they are now.
  const weeks = [...coverWeeks].sort((a, b) => b.weekEnding.localeCompare(a.weekEnding));
  for (const week of weeks) {
    const spots = coverSpots(week.rows ?? []);
    for (const row of week.rows ?? []) {
      const name = cleanName(row.name);
      const key = driverNameKey(name);
      if (!key || byKey.has(key)) continue;
      const spot = spots.get(key) ?? null;
      byKey.set(key, {
        key,
        name,
        rank: null,
        job: null,
        cover: spot && { weekEnding: week.weekEnding, ...spot },
      });
    }
  }
  return [...byKey.values()];
}

const rosterOut = (row) => ({
  _id: String(row._id),
  name: row.name ?? '',
  employeeId: row.employeeId ?? '',
  seniorityDate: row.seniorityDate ?? '',
  phone: row.phone ?? '',
});

// The longest run of `entries` (sorted by rank) whose dates rise with the
// rank, ties allowed. Between runs of the same length, the one with more
// name matches wins: a wrong pairing comes from a hand link (a suggestion
// accepted), not from two names with the same words. O(n²), fine for a few
// hundred drivers.
function longestRising(entries) {
  const weight = (entry) => (entry.exact ? 1001 : 1000);
  const best = entries.map(weight);
  const previous = entries.map(() => -1);
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      if (entries[j].date <= entries[i].date && best[j] + weight(entries[i]) > best[i]) {
        best[i] = best[j] + weight(entries[i]);
        previous[i] = j;
      }
    }
  }
  let end = -1;
  best.forEach((score, index) => {
    if (end < 0 || score > best[end]) end = index;
  });
  const run = [];
  for (let index = end; index >= 0; index = previous[index]) run.push(entries[index]);
  return run.reverse();
}

/**
 * → `{ drivers, rosterOnly, counts }`.
 * `drivers`: every sheet driver in seniority order, `{ key, name, rank, job,
 *   cover, match: 'linked' | 'exact' | null, roster, dateFitsRank, suggestion }`.
 *   `roster` is the linked roster row; `dateFitsRank` is false when its date
 *   doesn't fit the sheet's rank (null with no rank or no date); `suggestion` is
 *   `{ roster, score, fitsRank }` for an unlinked driver whose name is close to
 *   a free roster row.
 * `rosterOnly`: roster rows on no sheet and suggested for nobody, by date.
 *   `linkedTo` is the sheet name a row was linked to that isn't on the sheet
 *   now.
 */
export function mergeDrivers({ jobs = [], coverWeeks = [], roster = [] }) {
  const people = sheetDrivers(jobs, coverWeeks);
  const rows = roster.map((row) => ({
    ...row,
    id: String(row._id),
    notKeys: new Set(row.notSheetKeys ?? []),
  }));
  const taken = new Set(); // roster row ids
  const matches = new Map(); // sheet key → { row, match }
  const onSheet = new Set(people.map((person) => person.key));

  // 1. An admin's link. A row linked to a name keeps it, even while that name
  //    is off the sheet.
  for (const row of rows) {
    if (row.sheetKey && onSheet.has(row.sheetKey) && !matches.has(row.sheetKey)) {
      matches.set(row.sheetKey, { row, match: 'linked' });
      taken.add(row.id);
    }
  }
  const free = (row, person) => !taken.has(row.id) && !row.sheetKey && !row.notKeys.has(person.key);

  // 2. The same words in any order.
  for (const person of people) {
    if (matches.has(person.key)) continue;
    const row = rows.find((candidate) => free(candidate, person) && sameDriverName(candidate.name, person.name));
    if (row) {
      matches.set(person.key, { row, match: 'exact' });
      taken.add(row.id);
    }
  }

  // 3. Suggestions, best first, each roster row offered once.
  const pairs = [];
  for (const person of people) {
    if (matches.has(person.key)) continue;
    for (const row of rows) {
      if (!free(row, person)) continue;
      const score = nameMatchScore(person.name, row.name);
      const sameLast = driverLastName(person.name) === driverLastName(row.name);
      if (score >= SURE || (score >= LIKELY && sameLast)) pairs.push({ person, row, score });
    }
  }
  pairs.sort((a, b) => b.score - a.score);
  const suggestions = new Map(); // sheet key → { row, score }
  const suggested = new Set(); // roster row ids
  for (const { person, row, score } of pairs) {
    if (suggestions.has(person.key) || suggested.has(row.id)) continue;
    suggestions.set(person.key, { row, score });
    suggested.add(row.id);
  }

  // Ranked drivers with a linked roster date, by rank. The ones whose dates
  // rise with their rank (the longest such run) anchor everyone else's place;
  // the rest have a date that doesn't fit their rank (a wrong link or a wrong
  // date), and are flagged instead of trusted.
  const ranked = people
    .filter((person) => person.rank !== null && matches.get(person.key)?.row.seniorityDate)
    .map((person) => ({
      key: person.key,
      rank: person.rank,
      date: String(matches.get(person.key).row.seniorityDate),
      exact: matches.get(person.key).match === 'exact',
    }))
    .sort((a, b) => a.rank - b.rank);
  const anchors = longestRising(ranked);
  const anchorKeys = new Set(anchors.map((anchor) => anchor.key));
  const offRank = new Set(ranked.filter((entry) => !anchorKeys.has(entry.key)).map((entry) => entry.key));

  // The anchors just above and below a rank.
  const around = (rank) => ({
    above: anchors.findLast((anchor) => anchor.rank < rank) ?? null,
    below: anchors.find((anchor) => anchor.rank > rank) ?? null,
  });

  // Whether a date sits between the dates of the anchors ranked just above
  // and below this driver.
  const fitsRank = (person, date) => {
    if (person.rank === null || !date) return null;
    const { above, below } = around(person.rank);
    return (!above || date > above.date) && (!below || date < below.date);
  };

  // Where each driver goes, on the rank scale. The ranks are the building's
  // seniority list, and the Jobs tab shows only job holders' numbers: the
  // missing ones belong to drivers without a job. So:
  // - an anchor, and a driver with a rank but no roster date, sit at their rank;
  // - every other dated driver (cover and on-call drivers, and off-rank rows)
  //   goes by date between the anchors around it, taking the free numbers
  //   there in date order, or evenly spaced fractions when there aren't enough;
  // - a driver with neither goes last.
  // Dated drivers stay in date order either way.
  const takenRanks = new Set(people.filter((person) => person.rank !== null).map((person) => person.rank));
  const placeOf = new Map();
  for (const anchor of anchors) placeOf.set(anchor.key, anchor.rank);

  const loose = people
    .filter((person) => matches.get(person.key)?.row.seniorityDate && !anchorKeys.has(person.key))
    .map((person) => ({ key: person.key, date: String(matches.get(person.key).row.seniorityDate) }))
    .sort((a, b) => byText(a.date, b.date));
  // Anchors are in date order too (they rise), so each loose driver falls
  // into the gap after the last anchor dated on or before them.
  const gaps = new Map();
  for (const entry of loose) {
    const gap = anchors.filter((anchor) => anchor.date <= entry.date).length;
    if (!gaps.has(gap)) gaps.set(gap, []);
    gaps.get(gap).push(entry);
  }
  for (const [gap, entries] of gaps) {
    const low = gap > 0 ? anchors[gap - 1].rank : 0;
    const high = gap < anchors.length ? anchors[gap].rank : Infinity;
    const free = [];
    for (let rank = low + 1; rank < high && free.length < entries.length; rank += 1) {
      if (!takenRanks.has(rank)) free.push(rank);
    }
    entries.forEach((entry, index) => {
      placeOf.set(
        entry.key,
        free.length === entries.length
          ? free[index]
          : low + ((index + 1) / (entries.length + 1)) * (high - low),
      );
    });
  }

  const drivers = people
    .map((person) => {
      const matched = matches.get(person.key);
      const suggestion = suggestions.get(person.key);
      const date = matched ? String(matched.row.seniorityDate ?? '') : '';
      return {
        key: person.key,
        name: person.name,
        rank: person.rank,
        job: person.job,
        cover: person.cover,
        match: matched?.match ?? null,
        roster: matched ? rosterOut(matched.row) : null,
        // false: the linked row's date doesn't fit the sheet's rank.
        dateFitsRank: person.rank !== null && date ? !offRank.has(person.key) : null,
        suggestion: suggestion
          ? {
              roster: rosterOut(suggestion.row),
              score: suggestion.score,
              fitsRank: fitsRank(person, String(suggestion.row.seniorityDate ?? '')),
            }
          : null,
        place: placeOf.get(person.key) ?? person.rank ?? Infinity,
        date,
      };
    })
    .sort(
      (a, b) =>
        a.place - b.place ||
        byText(a.date, b.date) ||
        (a.rank ?? Infinity) - (b.rank ?? Infinity) ||
        a.name.localeCompare(b.name),
    )
    .map(({ place, date, ...driver }) => driver);

  const rosterOnly = rows
    .filter((row) => !taken.has(row.id) && !suggested.has(row.id))
    .map((row) => ({ ...rosterOut(row), linkedTo: row.sheetKey ?? null }))
    .sort((a, b) => byText(a.seniorityDate, b.seniorityDate) || a.name.localeCompare(b.name));

  return {
    drivers,
    rosterOnly,
    counts: {
      drivers: drivers.length,
      matched: drivers.filter((driver) => driver.roster).length,
      suggested: drivers.filter((driver) => driver.suggestion).length,
      noDetails: drivers.filter((driver) => !driver.roster && !driver.suggestion).length,
      cover: drivers.filter((driver) => driver.cover).length,
      offRank: drivers.filter((driver) => driver.dateFitsRank === false).length,
      rosterOnly: rosterOnly.length,
    },
  };
}
