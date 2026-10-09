// Pulls parts of the "ON CALL SHEET" into MongoDB (docs/ON-CALL-SHEET-SYNC.md).
// Shared by the admin Refresh buttons and, in stage 3, the sheet's webhook and
// the daily cron. Read-only on the sheet's side: everything goes through
// lib/googleSheets.js, whose API key can't write.
import { getTabValues, listTabs } from '@/lib/googleSheets';
import { parseCoverTab } from '@/lib/coverSheetParser';
import {
  SheetFormatError,
  findWeekTab,
  formatWeekEnding,
} from '@/lib/onCallSheet';
import {
  countUploadedCoverBidJobs,
  replaceCoverBidJobsForWeek,
} from '@/lib/db/coverBidJobs';
import { saveCoverBidPicks } from '@/lib/db/coverBidPicks';

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
