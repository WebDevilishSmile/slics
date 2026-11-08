import { COVER_POSITIONS, coverSpots } from '@/lib/coverDrivers';
import { autoHideReason, hideKey, isPicked, jobKey } from '@/lib/coverBidJobRow';
import { driverNameKey } from '@/lib/driverNames';
import { weekAssignment } from '@/lib/driverWeek';

// Cover History's reading of past weeks (/admin/cover/history,
// docs/COVER-BIDDING.md "Covers hub and History"). Pure: lib/db/coverHistory.js
// loads the weeks and hands them here, so scratch checks run on real data too.
// Admin-only output: it names drivers.
//
// What the saved data can say (checked against production 2026-11-07):
// - Who covered which job comes from the pick list's "Job / status" column:
//   a row whose `job` is one of the week's cover job numbers is the driver who
//   took it, at that row's place. The sheet's pick columns (picks 1–7) are
//   empty, and a job's NAME column is often a last name only, so neither is
//   used.
// - A place is the pick order: 1–20 cover drivers, after that on call
//   (lib/coverDrivers.js). An early place taking a job means a wanted job.
// - Weeks before the sheet sync (2026-10-09) were photo uploads with no pick
//   list: they have jobs only.

// A leave as the sheet writes it ("VACATION", "Buy out"), grouped.
const LEAVES = [
  [/VACATION|\bVAC\b/i, 'Vacation'],
  [/FMLA/i, 'FMLA'],
  [/BUY\s*OUT/i, 'Buyout'],
  [/\bLOA\b|LEAVE/i, 'Leave'],
  [/SICK/i, 'Sick'],
  [/INJUR/i, 'Injury'],
  [/HOLIDAY/i, 'Holiday'],
  [/PERSONAL/i, 'Personal'],
  [/RTW/i, 'Return to work'],
  [/\bOFF\b/i, 'Off'],
];
export function leaveType(status) {
  if (!status) return 'Out';
  return LEAVES.find(([pattern]) => pattern.test(status))?.[1] ?? 'Out';
}

const placeOf = (spot) => (spot.kind === 'cover' ? spot.position : spot.order) ?? null;

const median = (values) => {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
};
const mean = (values) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
const round1 = (value) => (value === null ? null : Math.round(value * 10) / 10);
const increment = (counts, key, by = 1) => {
  counts[key] = (counts[key] ?? 0) + by;
};

// One week as it closed.
//   week: { weekEnding, jobs: [{ jobNumber, name, sheetHidden, source,
//     coverReason? }], rows (the pick list's rows, or null), jobChanges,
//     pickChanges, listTotals ({ lists, jobs } or null), bidMoved }
//   hiddenKeys: a Set of hideKeys (getHiddenJobKeys)
// → { summary, jobs, drivers }:
//   summary: counts for the charts and the patterns (below);
//   jobs: each job as it closed, with who covered it and at which place;
//   drivers: each pick-list row's outcome.
export function readWeek(week, hiddenKeys = new Set()) {
  const { weekEnding } = week;
  const rows = week.rows ?? [];
  const hasPicks = rows.length > 0;
  // A photo upload (before the sheet sync) read only the jobs, never who took
  // them: its outcome is unknown, not "nobody took it".
  const uploaded = week.jobs.length > 0 && week.jobs.every((job) => job.source !== 'sheet');

  const jobs = week.jobs.map((job) => {
    const key = jobKey(job.jobNumber);
    const auto = autoHideReason(job);
    const hidden = auto ?? (key && hiddenKeys.has(hideKey(weekEnding, job.jobNumber)) ? 'admin' : null);
    return {
      jobKey: key,
      jobNumber: String(job.jobNumber ?? '').trim(),
      name: job.name ?? '',
      coverReason: job.coverReason ?? '',
      taken: uploaded ? null : isPicked(job),
      hidden,
      coveredBy: null,
      place: null,
    };
  });
  const jobsByKey = new Map(jobs.filter((job) => job.jobKey).map((job) => [job.jobKey, job]));

  // Each row's outcome, in sheet order. A driver listed twice keeps their
  // first place (coverSpots).
  const spots = hasPicks ? coverSpots(rows) : new Map();
  const drivers = [];
  const seen = new Set();
  for (const row of rows) {
    const key = driverNameKey(row.name);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    const spot = spots.get(key);
    if (!spot) continue;
    const assignment = weekAssignment({ spot, coverJobs: jobs.filter((job) => job.jobKey) });
    const place = placeOf(spot);
    const driver = {
      key,
      name: row.name,
      place,
      callIn: spot.callIn || '',
      list: spot.kind,
      status: spot.status ?? null,
      kind: assignment.kind,
      jobNumber: assignment.jobNumber ?? null,
      leave: assignment.kind === 'off' ? leaveType(assignment.status) : null,
      text: assignment.kind === 'other' ? assignment.text : null,
    };
    drivers.push(driver);
    if (driver.kind === 'covering') {
      const job = jobsByKey.get(jobKey(driver.jobNumber));
      if (job && !job.coveredBy) {
        job.coveredBy = driver.name;
        job.place = place;
      }
    }
  }

  const shown = jobs.filter((job) => !job.hidden);
  const hidden = { admin: 0, sheet: 0, sleeper: 0 };
  for (const job of jobs) if (job.hidden) hidden[job.hidden] += 1;
  const leaves = {};
  for (const driver of drivers) if (driver.kind === 'off') increment(leaves, driver.leave);
  const coverRows = drivers.filter((driver) => driver.list === 'cover');
  const takenPlaces = jobs.map((job) => job.place).filter((place) => place !== null);

  const summary = {
    weekEnding,
    uploaded,
    hasPicks,
    posted: jobs.length,
    shown: shown.length,
    // null for an upload: unknown.
    taken: uploaded ? null : shown.filter((job) => job.taken).length,
    open: uploaded ? null : shown.filter((job) => !job.taken).length,
    hidden,
    // Jobs the pick list says who covered.
    placed: takenPlaces.length,
    // How far down the list the jobs went: the last place that got one.
    deepestPlace: takenPlaces.length ? Math.max(...takenPlaces) : null,
    listed: drivers.length,
    cover: coverRows.length,
    covering: drivers.filter((driver) => driver.kind === 'covering').length,
    onCallCovering: drivers.filter((driver) => driver.kind === 'covering' && driver.list === 'onCall').length,
    coverNoJob: drivers.filter((driver) => driver.kind === 'coverUnpicked').length,
    onCall: drivers.filter((driver) => driver.list === 'onCall').length,
    out: drivers.filter((driver) => driver.kind === 'off').length,
    leaves,
    jobChanges: week.jobChanges ?? 0,
    pickChanges: week.pickChanges ?? 0,
    lists: week.listTotals?.lists ?? null,
    bidMoved: Boolean(week.bidMoved),
  };

  return { summary, jobs, drivers };
}

// Every job number across the weeks (oldest first), as rows for the Jobs table.
export function jobTrends(readWeeks, listTotals = []) {
  const byKey = new Map();
  for (const { summary, jobs } of readWeeks) {
    for (const job of jobs) {
      if (!job.jobKey) continue;
      const trend = byKey.get(job.jobKey) ?? {
        jobKey: job.jobKey,
        jobNumber: job.jobNumber,
        weeks: 0,
        // Weeks the outcome is known (not a photo upload, not hidden).
        knownWeeks: 0,
        taken: 0,
        open: 0,
        hiddenWeeks: 0,
        places: [],
        lists: 0,
        first: 0,
        listWeeks: 0,
        firstWeek: summary.weekEnding,
        lastWeek: summary.weekEnding,
      };
      trend.jobNumber = job.jobNumber || trend.jobNumber;
      trend.weeks += 1;
      trend.lastWeek = summary.weekEnding;
      if (job.hidden) trend.hiddenWeeks += 1;
      else if (job.taken !== null) {
        trend.knownWeeks += 1;
        if (job.taken) trend.taken += 1;
        else trend.open += 1;
      }
      if (job.place !== null) trend.places.push(job.place);
      byKey.set(job.jobKey, trend);
    }
  }
  for (const totals of listTotals) {
    for (const job of totals.jobs ?? []) {
      const trend = byKey.get(job.jobKey);
      if (!trend) continue;
      trend.lists += job.lists;
      trend.first += job.first;
      trend.listWeeks += 1;
    }
  }
  return [...byKey.values()].map(({ places, ...trend }) => ({
    ...trend,
    timesPlaced: places.length,
    avgPlace: round1(mean(places)),
    bestPlace: places.length ? Math.min(...places) : null,
    // Taken by a driver after the cover drivers: one nobody on the cover list wanted.
    onCallTakes: places.filter((place) => place > COVER_POSITIONS).length,
    shownWeeks: trend.weeks - trend.hiddenWeeks,
  }));
}

// Filters on the Jobs table, and the patterns, share these.
export const JOB_FILTERS = {
  recurring: (job) => job.weeks >= 3,
  neverTaken: (job) => job.knownWeeks >= 3 && job.taken === 0,
  takenEarly: (job) => job.timesPlaced >= 2 && job.avgPlace !== null && job.avgPlace <= 5,
  onCall: (job) => job.timesPlaced >= 2 && job.onCallTakes / job.timesPlaced >= 0.5,
  onLists: (job) => job.lists > 0,
};

// Every driver on the pick lists across the weeks, as rows for the Drivers
// table.
export function driverTrends(readWeeks) {
  const byKey = new Map();
  for (const { summary, drivers } of readWeeks) {
    for (const driver of drivers) {
      const trend = byKey.get(driver.key) ?? {
        key: driver.key,
        name: driver.name,
        weeks: 0,
        coverWeeks: 0,
        covering: 0,
        coverNoJob: 0,
        onCallWeeks: 0,
        out: 0,
        leaves: {},
        places: [],
        jobs: [],
      };
      trend.name = driver.name;
      trend.weeks += 1;
      if (driver.list === 'cover') trend.coverWeeks += 1;
      else trend.onCallWeeks += 1;
      if (driver.kind === 'covering') {
        trend.covering += 1;
        trend.jobs.push({ weekEnding: summary.weekEnding, jobNumber: driver.jobNumber, place: driver.place });
      }
      if (driver.kind === 'coverUnpicked') trend.coverNoJob += 1;
      if (driver.kind === 'off') {
        trend.out += 1;
        increment(trend.leaves, driver.leave);
      }
      if (driver.place !== null) trend.places.push({ weekEnding: summary.weekEnding, place: driver.place });
      byKey.set(driver.key, trend);
    }
  }
  return [...byKey.values()].map(({ places, ...trend }) => {
    const first = places[0]?.place ?? null;
    const last = places.at(-1)?.place ?? null;
    return {
      ...trend,
      avgPlace: round1(mean(places.map((entry) => entry.place))),
      firstPlace: first,
      lastPlace: last,
      // Positive: moved up the list (a smaller number) from the first week to the latest.
      moved: first !== null && last !== null && places.length >= 2 ? first - last : 0,
      places,
    };
  });
}

const percent = (from, to) => Math.round(((to - from) / from) * 100);
const weekLabel = (weekEnding) => {
  const [, month, day] = weekEnding.split('-');
  return `W/E ${Number(month)}/${Number(day)}`;
};
const listNames = (items, count = 3) => {
  const shown = items.slice(0, count);
  const more = items.length - shown.length;
  return `${shown.join(', ')}${more > 0 ? ` and ${more} more` : ''}`;
};

// What stands out, in plain words: each finding is a rule with a threshold,
// so it shows only when the weeks bear it out. `tone` picks the icon: 'up'
// and 'down' for a trend, 'alert' for something to look into, 'note' for the
// rest. `anchor` is what it's about: { week } opens that week below, { section }
// scrolls to the Jobs or Drivers table. `names` is a function that shows a
// driver's sheet name (displayName); the module stays free of it.
export function findPatterns(summaries, jobs, drivers, { names = (name) => name } = {}) {
  const findings = [];
  const posted = summaries.filter((week) => week.shown > 0);

  // Jobs per week, the first half of the range against the second.
  if (posted.length >= 4) {
    const half = Math.floor(posted.length / 2);
    const before = mean(posted.slice(0, half).map((week) => week.shown));
    const after = mean(posted.slice(-half).map((week) => week.shown));
    const change = percent(before, after);
    if (Math.abs(change) >= 15) {
      findings.push({
        id: 'volume',
        tone: change > 0 ? 'up' : 'down',
        text: `Cover jobs per week ${change > 0 ? 'rose' : 'fell'} ${Math.abs(change)}%: about ${Math.round(before)} a week in the first ${half} weeks, ${Math.round(after)} in the last ${half}.`,
      });
    } else {
      findings.push({
        id: 'volume',
        tone: 'note',
        text: `Steady volume: about ${Math.round(mean(posted.map((week) => week.shown)))} cover jobs a week (between ${Math.min(...posted.map((week) => week.shown))} and ${Math.max(...posted.map((week) => week.shown))}).`,
      });
    }
  }

  // Jobs nobody took, in the weeks whose outcome is known.
  const known = posted.filter((week) => week.open !== null);
  const leftOpen = known.filter((week) => week.open > 0);
  if (known.length > 0) {
    if (leftOpen.length === 0) {
      findings.push({ id: 'open', tone: 'note', text: `Every job was taken in all ${known.length} weeks with a known outcome.` });
    } else {
      const worst = [...leftOpen].sort((a, b) => b.open - a.open)[0];
      findings.push({
        id: 'open',
        tone: leftOpen.length >= known.length / 2 ? 'alert' : 'note',
        text:
          leftOpen.length === 1
            ? `1 of ${known.length} weeks ended with ${worst.open === 1 ? 'a job' : `${worst.open} jobs`} nobody took: ${weekLabel(worst.weekEnding)}.`
            : `${leftOpen.length} of ${known.length} weeks ended with jobs nobody took, the most ${worst.open} in ${weekLabel(worst.weekEnding)}.`,
        anchor: { week: worst.weekEnding },
      });
    }
  }

  // Recurring jobs never taken.
  const never = jobs.filter(JOB_FILTERS.neverTaken).sort((a, b) => b.knownWeeks - a.knownWeeks);
  if (never.length) {
    findings.push({
      id: 'never',
      tone: 'alert',
      text: `Posted 3 weeks or more and never taken: ${listNames(never.map((job) => `${job.jobNumber} (${job.knownWeeks} weeks)`))}.`,
      anchor: { section: 'jobs', filter: 'neverTaken' },
    });
  }

  // The most and least wanted, by the place on the list that took them.
  const wanted = jobs.filter(JOB_FILTERS.takenEarly).sort((a, b) => a.avgPlace - b.avgPlace || b.timesPlaced - a.timesPlaced);
  if (wanted.length) {
    findings.push({
      id: 'wanted',
      tone: 'up',
      text: `Most wanted: ${listNames(wanted.map((job) => `${job.jobNumber} (taken at place ${job.avgPlace} on average, ${job.timesPlaced} weeks)`))}. The first drivers on the list take them.`,
      anchor: { section: 'jobs', filter: 'takenEarly' },
    });
  }
  const unwanted = jobs.filter(JOB_FILTERS.onCall).sort((a, b) => b.onCallTakes - a.onCallTakes);
  if (unwanted.length) {
    findings.push({
      id: 'unwanted',
      tone: 'down',
      text: `Usually left for on-call drivers: ${listNames(unwanted.map((job) => `${job.jobNumber} (${job.onCallTakes} of ${job.timesPlaced} weeks)`))}. The cover drivers pass on them.`,
      anchor: { section: 'jobs', filter: 'onCall' },
    });
  }

  const picked = summaries.filter((week) => week.hasPicks);

  // How far down the list the jobs go.
  const depths = picked.filter((week) => week.deepestPlace !== null);
  if (depths.length >= 2) {
    const deepest = [...depths].sort((a, b) => b.deepestPlace - a.deepestPlace)[0];
    const shallowest = [...depths].sort((a, b) => a.deepestPlace - b.deepestPlace)[0];
    if (deepest.deepestPlace - shallowest.deepestPlace >= 5) {
      findings.push({
        id: 'depth',
        tone: 'note',
        text: `How far down the list the jobs went swings: to place ${deepest.deepestPlace} in ${weekLabel(deepest.weekEnding)}, only ${shallowest.deepestPlace} in ${weekLabel(shallowest.weekEnding)}.`,
        anchor: { week: deepest.weekEnding },
      });
    }
  }

  // Cover drivers left without a job: more cover drivers than jobs.
  const short = picked.filter((week) => week.coverNoJob > 0);
  if (short.length) {
    const worst = [...short].sort((a, b) => b.coverNoJob - a.coverNoJob)[0];
    findings.push({
      id: 'noJob',
      tone: short.length >= picked.length / 2 ? 'alert' : 'note',
      text: `In ${short.length} of ${picked.length} weeks, cover drivers were left without a job, ${worst.coverNoJob} in ${weekLabel(worst.weekEnding)}.`,
      anchor: { week: worst.weekEnding },
    });
  }

  // Weeks with unusually many drivers out, or on call.
  const spike = (field, words) => {
    const usual = median(picked.map((week) => week[field]));
    if (usual === null || picked.length < 3) return;
    const high = picked
      .filter((week) => week[field] >= Math.max(usual * 1.5, usual + 3))
      .sort((a, b) => b[field] - a[field]);
    if (!high.length) return;
    const top = high[0];
    const why =
      field === 'out'
        ? Object.entries(top.leaves)
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => `${count} ${type}`)
            .join(', ')
        : '';
    findings.push({
      id: `spike-${field}`,
      tone: 'alert',
      text: `${weekLabel(top.weekEnding)} had ${top[field]} drivers ${words} (usually ${Math.round(usual)})${why ? `: ${why}` : ''}.${high.length > 1 ? ` Also high: ${listNames(high.slice(1).map((week) => weekLabel(week.weekEnding)))}.` : ''}`,
      anchor: { week: top.weekEnding },
    });
  };
  spike('out', 'out');
  spike('onCall', 'on call');

  // The week that changed most after it was posted.
  const churn = summaries.filter((week) => week.jobChanges + week.pickChanges > 0);
  if (churn.length >= 3) {
    const usual = median(churn.map((week) => week.jobChanges + week.pickChanges));
    const top = [...churn].sort((a, b) => b.jobChanges + b.pickChanges - (a.jobChanges + a.pickChanges))[0];
    if (top.jobChanges + top.pickChanges >= usual * 1.5) {
      findings.push({
        id: 'churn',
        tone: 'note',
        text: `${weekLabel(top.weekEnding)} changed most after it was posted: ${top.jobChanges} job changes and ${top.pickChanges} pick list changes (a week usually has ${Math.round(usual)}).`,
        anchor: { week: top.weekEnding },
      });
    }
  }

  // Drivers who moved on the list. On-call numbers shuffle every week as
  // drivers go out and come back, so only a big, lasting move counts.
  const movers = drivers.filter((driver) => driver.places.length >= 4 && Math.abs(driver.moved) >= 10);
  const up = movers.filter((driver) => driver.moved > 0).sort((a, b) => b.moved - a.moved);
  const down = movers.filter((driver) => driver.moved < 0).sort((a, b) => a.moved - b.moved);
  if (up.length) {
    findings.push({
      id: 'movedUp',
      tone: 'up',
      text: `Moved up the pick list 10 places or more: ${listNames(up.map((driver) => `${names(driver.name)} (${driver.firstPlace} → ${driver.lastPlace})`))}.`,
      anchor: { section: 'drivers' },
    });
  }
  if (down.length) {
    findings.push({
      id: 'movedDown',
      tone: 'down',
      text: `Moved down 10 places or more: ${listNames(down.map((driver) => `${names(driver.name)} (${driver.firstPlace} → ${driver.lastPlace})`))}.`,
      anchor: { section: 'drivers' },
    });
  }

  // The most out.
  const often = drivers.filter((driver) => driver.weeks >= 3 && driver.out / driver.weeks >= 0.5).sort((a, b) => b.out - a.out);
  if (often.length) {
    findings.push({
      id: 'oftenOut',
      tone: 'note',
      text: `Out half the weeks or more: ${listNames(often.map((driver) => `${names(driver.name)} (${driver.out} of ${driver.weeks})`))}.`,
      anchor: { section: 'drivers' },
    });
  }

  // The cover lists' anonymous totals.
  const listed = summaries.filter((week) => week.lists);
  const onLists = jobs.filter(JOB_FILTERS.onLists).sort((a, b) => b.lists - a.lists || b.first - a.first);
  if (listed.length && onLists.length) {
    findings.push({
      id: 'lists',
      tone: 'note',
      text: `On drivers' cover lists most: ${listNames(onLists.map((job) => `${job.jobNumber} (${job.lists} lists, first on ${job.first})`))}. ${listed.length} ${listed.length === 1 ? 'week has' : 'weeks have'} list totals.`,
      anchor: { section: 'jobs', filter: 'onLists' },
    });
  }

  const moved = summaries.filter((week) => week.bidMoved);
  if (moved.length) {
    findings.push({
      id: 'bidDay',
      tone: 'note',
      text: `The bid day was moved in ${moved.length} ${moved.length === 1 ? 'week' : 'weeks'}: ${listNames(moved.map((week) => weekLabel(week.weekEnding)), 5)}.`,
    });
  }

  // What the range can't say.
  const noPicks = summaries.filter((week) => !week.hasPicks);
  if (noPicks.length && picked.length) {
    findings.push({
      id: 'coverage',
      tone: 'note',
      text: `${noPicks.length} ${noPicks.length === 1 ? 'week has' : 'weeks have'} jobs but no saved pick list (photo uploads, before the sheet sync), so who took a job and driver numbers start ${weekLabel(picked[0].weekEnding)}.`,
    });
  }

  return findings;
}
