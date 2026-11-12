// Pulls parts of the "ON CALL SHEET" into MongoDB (docs/ON-CALL-SHEET-SYNC.md).
// Shared by the admin Refresh buttons and, in stage 3, the sheet's webhook and
// the daily cron. Read-only on the sheet's side: everything goes through
// lib/googleSheets.js, whose API key can't write.
import { after } from 'next/server';
import { SHEET_PUSH_DIGEST } from '@/constants';
import { getHiddenRows, getTabValues, listTabs } from '@/lib/googleSheets';
import { getHubConfig } from '@/lib/db/hubConfigs';
import { parseCoverTab } from '@/lib/coverSheetParser';
import { parseJobsTab } from '@/lib/jobsSheetParser';
import {
  SheetFormatError,
  findJobsTab,
  findWeekTab,
  formatWeekEnding,
  isSaturday,
  todayInNewYork,
  weekEndingFromTabTitle,
} from '@/lib/onCallSheet';
import {
  countUploadedCoverBidJobs,
  replaceCoverBidJobsForWeek,
} from '@/lib/db/coverBidJobs';
import { saveCoverBidPicks } from '@/lib/db/coverBidPicks';
import { saveJobsSnapshot } from '@/lib/db/sheetJobs';
import {
  notifyCoverJobs,
  notifyCoverListTaken,
  notifyCoverPicks,
  notifyJobChanges,
} from '@/lib/pushEvents';
import {
  acquireSyncLock,
  forceReleaseSyncLock,
  releaseSyncLock,
} from '@/lib/db/syncState';

// Which spreadsheet to read: the hub's (`hub.sheet.id`, lib/db/hubConfigs.js),
// which for BETPA is ON_CALL_SHEET_ID until hub-configs has its own. Only BETPA
// until stage 2 of docs/MULTI-HUB.md passes a hub through.
async function sheetToRead() {
  const hub = await getHubConfig();
  return { spreadsheetId: hub.sheet.id };
}

// Each refresh returns { status, message?, data? }. `status` is 'ok' or one of
// the outcomes below; `message` is written for the admin. A Google or MongoDB
// failure throws instead.
//   'no-tab'   the sheet has no such tab
//   'uploaded' the week has jobs saved from an upload (cover weeks only)
//   'format'   the tab isn't laid out as expected, so nothing was saved

// One week's cover tab: its jobs into `cover-bid-jobs` (what changed into
// `cover-job-changes`), its picks into `cover-bid-picks`. `tabs` can be passed
// in when the caller already listed them (stage 3 refreshes several weeks per
// ping). `source` is what started it, as for the Jobs tab below.
export async function refreshCoverWeek({ weekEnding, replaceUploaded = false, user = null, tabs, source = 'refresh' }) {
  const weekLabel = formatWeekEnding(weekEnding);
  const sheet = await sheetToRead();
  const tab = findWeekTab(tabs ?? (await listTabs(sheet)), weekEnding);
  if (!tab) {
    return { status: 'no-tab', message: `The sheet has no tab for W/E ${weekLabel}.` };
  }

  let parsed;
  try {
    // The rows the sheet hides come in a second, cell-free request.
    const [values, hiddenRows] = await Promise.all([getTabValues(tab.title, sheet), getHiddenRows(tab.title, sheet)]);
    parsed = parseCoverTab(values, { hiddenRows });
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

  const { changed: jobsChanged, changes: jobChanges, changeRows } = await replaceCoverBidJobsForWeek(
    weekEnding,
    parsed.jobs,
    user,
    { source }
  );
  const { events: pickChanges, drivers: pickDrivers, firstRefresh } = await saveCoverBidPicks({
    weekEnding,
    rows: parsed.picks,
    sheetTab: tab.title,
    user,
  });

  // The admins' pushes about this wait for the sheet to go quiet and go out
  // as one digest (lib/sheetNotices.js, from the cron): dispatch types a job
  // in cell by cell, and each cell is a read like this one. Only with
  // SHEET_PUSH_DIGEST off does every read notify at once, as it did until
  // 2026-11-11: the admin who pressed Refresh has it on screen; a ping or the
  // cron has no user, so everyone who chose it gets one.
  if (!SHEET_PUSH_DIGEST) {
    const except = user?.id;
    if (jobChanges > 0) after(() => notifyCoverJobs({ except }));
    if (pickChanges > 0) {
      after(() => notifyCoverPicks({ weeks: [{ weekEnding, jobs: 0, drivers: pickDrivers }], except }));
    }
  }
  // Drivers whose cover list held a job just taken or removed
  // (docs/PUSH-NOTIFICATIONS.md, stage 3), while the week isn't over. Each
  // is told about their own list; none is told who took it.
  if (jobChanges > 0 && isCurrentWeek(weekEnding)) {
    after(() => notifyCoverListTaken({ weekEnding, changes: changeRows }));
  }

  return {
    status: 'ok',
    data: {
      jobs: parsed.jobs.length,
      jobsChanged,
      jobChanges,
      picks: parsed.picks.length,
      pickChanges,
      firstRefresh,
    },
  };
}

// The `Jobs` tab into `sheet-jobs`, recording what changed in
// `sheet-job-changes`. `source` says what started it: 'refresh' (the button),
// 'ping' or 'cron'; `userId` is the admin who pressed the button, who isn't
// sent a push about changes already on their screen.
export async function refreshJobsTab({ source = 'refresh', tabs, userId } = {}) {
  const sheet = await sheetToRead();
  const tab = findJobsTab(tabs ?? (await listTabs(sheet)));
  if (!tab) {
    return { status: 'no-tab', message: 'The sheet has no Jobs tab.' };
  }

  let rows;
  try {
    rows = parseJobsTab(await getTabValues(tab.title, sheet));
  } catch (error) {
    if (!(error instanceof SheetFormatError)) throw error;
    return { status: 'format', message: `The Jobs tab isn't laid out as expected: ${error.message}.` };
  }
  if (rows.length === 0) {
    return { status: 'format', message: 'The Jobs tab has no jobs listed, so nothing was saved.' };
  }

  const result = await saveJobsSnapshot(rows, { source });
  if (result.changes > 0 && !SHEET_PUSH_DIGEST) {
    // Only with the digests off (see refreshCoverWeek): after the response,
    // each admin who chose it is told the changes they haven't seen.
    after(() => notifyJobChanges({ except: userId }));
  }
  return { status: 'ok', data: { jobs: rows.length, ...result } };
}

// --- Automatic sync (stage 3): the sheet's ping and the daily cron ---

// Reads past this many passes in a row are left to the next ping or the cron,
// so a long burst of picks can't hold one function open.
const MAX_PASSES = 3;

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
    return { results: [await syncWeek(weekEnding, { source })] };
  }

  const tabs = await listTabs(await sheetToRead());
  const results = [await syncTarget('jobs', () => refreshJobsTab({ source, tabs }))];
  for (const weekEnding of currentWeekEndings(tabs)) {
    results.push(await syncWeek(weekEnding, { tabs, source }));
  }
  return { results };
}

// An automatic refresh never replaces uploaded jobs and has no user.
function syncWeek(weekEnding, { tabs, source }) {
  return syncTarget(`week:${weekEnding}`, () =>
    refreshCoverWeek({ weekEnding, replaceUploaded: false, user: null, tabs, source })
  );
}
