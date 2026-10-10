// Pulls parts of the "ON CALL SHEET" into MongoDB (docs/ON-CALL-SHEET-SYNC.md).
// Shared by the admin Refresh buttons and, in stage 3, the sheet's webhook and
// the daily cron. Read-only on the sheet's side: everything goes through
// lib/googleSheets.js, whose API key can't write.
import { getTabValues, listTabs } from '@/lib/googleSheets';
import { parseCoverTab } from '@/lib/coverSheetParser';
import { parseJobsTab } from '@/lib/jobsSheetParser';
import {
  SheetFormatError,
  findJobsTab,
  findWeekTab,
  formatWeekEnding,
  isSaturday,
  weekEndingFromTabTitle,
} from '@/lib/onCallSheet';
import {
  countUploadedCoverBidJobs,
  replaceCoverBidJobsForWeek,
} from '@/lib/db/coverBidJobs';
import { saveCoverBidPicks } from '@/lib/db/coverBidPicks';
import { saveJobsSnapshot } from '@/lib/db/sheetJobs';
import {
  acquireSyncLock,
  forceReleaseSyncLock,
  releaseSyncLock,
} from '@/lib/db/syncState';

// Each refresh returns { status, message?, data? }. `status` is 'ok' or one of
// the outcomes below; `message` is written for the admin. A Google or MongoDB
// failure throws instead.
//   'no-tab'   the sheet has no such tab
//   'uploaded' the week has jobs saved from an upload (cover weeks only)
//   'format'   the tab isn't laid out as expected, so nothing was saved

// One week's cover tab: its jobs into `cover-bid-jobs`, its picks into
// `cover-bid-picks`. `tabs` can be passed in when the caller already listed
// them (stage 3 refreshes several weeks per ping).
export async function refreshCoverWeek({ weekEnding, replaceUploaded = false, user = null, tabs }) {
  const weekLabel = formatWeekEnding(weekEnding);
  const tab = findWeekTab(tabs ?? (await listTabs()), weekEnding);
  if (!tab) {
    return { status: 'no-tab', message: `The sheet has no tab for W/E ${weekLabel}.` };
  }

  let parsed;
  try {
    parsed = parseCoverTab(await getTabValues(tab.title));
  } catch (error) {
    if (!(error instanceof SheetFormatError)) throw error;
    return { status: 'format', message: `Tab ${tab.title} isn't laid out as expected: ${error.message}.` };
  }
  if (parsed.weekEnding !== weekEnding) {
    return {
      status: 'format',
      message: `Tab ${tab.title} says W/E ${formatWeekEnding(parsed.weekEnding)} in its title, so nothing was saved.`,
    };
  }
  if (parsed.jobs.length === 0) {
    return { status: 'format', message: `Tab ${tab.title} has no jobs listed, so nothing was saved.` };
  }

  if (!replaceUploaded) {
    const uploaded = await countUploadedCoverBidJobs(weekEnding);
    if (uploaded > 0) {
      return {
        status: 'uploaded',
        message: `W/E ${weekLabel} has ${uploaded} job${uploaded === 1 ? '' : 's'} saved from an upload. Replace ${uploaded === 1 ? 'it' : 'them'} with the sheet's ${parsed.jobs.length}?`,
      };
    }
  }

  const { changed: jobsChanged } = await replaceCoverBidJobsForWeek(weekEnding, parsed.jobs, user);
  const { events: pickChanges, firstRefresh } = await saveCoverBidPicks({
    weekEnding,
    rows: parsed.picks,
    sheetTab: tab.title,
    user,
  });

  return {
    status: 'ok',
    data: {
      jobs: parsed.jobs.length,
      jobsChanged,
      picks: parsed.picks.length,
      pickChanges,
      firstRefresh,
    },
  };
}

// The `Jobs` tab into `sheet-jobs`, recording what changed in
// `sheet-job-changes`. `source` says what started it: 'refresh' (the button),
// 'ping' or 'cron'.
export async function refreshJobsTab({ source = 'refresh', tabs } = {}) {
  const tab = findJobsTab(tabs ?? (await listTabs()));
  if (!tab) {
    return { status: 'no-tab', message: 'The sheet has no Jobs tab.' };
  }

  let rows;
  try {
    rows = parseJobsTab(await getTabValues(tab.title));
  } catch (error) {
    if (!(error instanceof SheetFormatError)) throw error;
    return { status: 'format', message: `The Jobs tab isn't laid out as expected: ${error.message}.` };
  }
  if (rows.length === 0) {
    return { status: 'format', message: 'The Jobs tab has no jobs listed, so nothing was saved.' };
  }

  const result = await saveJobsSnapshot(rows, { source });
  return { status: 'ok', data: { jobs: rows.length, ...result } };
}

// --- Automatic sync (stage 3): the sheet's ping and the daily cron ---

// Reads past this many passes in a row are left to the next ping or the cron,
// so a long burst of picks can't hold one function open.
const MAX_PASSES = 3;

// Today as 'YYYY-MM-DD' where the drivers are, not in the server's UTC.
function todayInNewYork() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
}

// A week still worth updating: its Saturday is today or later.
function isCurrentWeek(weekEnding) {
  return weekEnding >= todayInNewYork();
}

// Every week with a tab from this week on, oldest first, one per week.
function currentWeekEndings(tabs) {
  const weeks = new Set(
    tabs.map((tab) => weekEndingFromTabTitle(tab.title)).filter((week) => week && isSaturday(week) && isCurrentWeek(week))
  );
  return [...weeks].sort();
}

// Runs one target's refresh under its lock, again while pings keep arriving.
// Never throws: the outcome is recorded in sync-state and returned.
async function syncTarget(target, run) {
  const lock = await acquireSyncLock(target);
  if (lock.queued) return { target, status: 'queued' };

  let result;
  for (let pass = 1; pass <= MAX_PASSES; pass += 1) {
    try {
      result = await run();
    } catch (error) {
      console.error(`Error syncing ${target} from the on-call sheet:`, error);
      result = { status: 'error', message: error?.message ?? 'Unknown error' };
    }
    // 'uploaded' is a week the admin filled from a photo: skipped on purpose.
    const failed = result.status !== 'ok' && result.status !== 'uploaded';
    const released = await releaseSyncLock(target, lock.token, {
      outcome: result.status,
      error: failed ? result.message : null,
    }).catch((error) => {
      console.error(`Error releasing the ${target} sync lock:`, error);
      return true;
    });
    if (released) return { target, status: result.status, passes: pass };
  }
  await forceReleaseSyncLock(target, lock.token).catch((error) => {
    console.error(`Error releasing the ${target} sync lock:`, error);
  });
  return { target, status: result.status, passes: MAX_PASSES };
}

// What the webhook and the cron call. `hint` is the ping's body:
//   { tab: 'Jobs' }        the Jobs tab
//   { tab: '10/17/2026' }  that week, if it isn't over
//   { tab: <other> }       nothing (SHIFTERS and the rest are never read)
//   anything else          Jobs plus every week from this one on
// The hint only picks what to re-read; the data always comes from the sheet.
// Returns { results: [{ target, status, passes? }] }.
export async function syncFromSheet(hint = {}, { source = 'ping' } = {}) {
  const tab = typeof hint.tab === 'string' ? hint.tab : null;

  if (tab !== null && findJobsTab([{ title: tab }])) {
    return { results: [await syncTarget('jobs', () => refreshJobsTab({ source }))] };
  }
  if (tab !== null) {
    const weekEnding = weekEndingFromTabTitle(tab);
    if (!weekEnding || !isSaturday(weekEnding) || !isCurrentWeek(weekEnding)) {
      return { results: [] };
    }
    return { results: [await syncWeek(weekEnding)] };
  }

  const tabs = await listTabs();
  const results = [await syncTarget('jobs', () => refreshJobsTab({ source, tabs }))];
  for (const weekEnding of currentWeekEndings(tabs)) {
    results.push(await syncWeek(weekEnding, tabs));
  }
  return { results };
}

// An automatic refresh never replaces uploaded jobs and has no user.
function syncWeek(weekEnding, tabs) {
  return syncTarget(`week:${weekEnding}`, () =>
    refreshCoverWeek({ weekEnding, replaceUploaded: false, user: null, tabs })
  );
}
