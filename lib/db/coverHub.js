import { coverDriversFromPicks } from '@/lib/coverDrivers';
import { isJobHidden, isPicked } from '@/lib/coverBidJobRow';
import { currentBidWeek } from '@/lib/bidDay';
import { formatWeekEnding, todayInNewYork } from '@/lib/onCallSheet';
import { getCoverBidJobsByWeek, getCoverBidJobWeeks } from '@/lib/db/coverBidJobs';
import { getHiddenJobKeys } from '@/lib/db/coverBidJobHides';
import { getCoverBidPicks } from '@/lib/db/coverBidPicks';
import { countWeekCoverLists } from '@/lib/db/coverPreferences';
import { getOpenCoverReportSummary } from '@/lib/db/coverReports';

// The status line under each tool on the Covers hub (/admin/cover,
// docs/COVER-BIDDING.md "Covers hub and History"), keyed like COVER_TOOLS in
// constants.js. They're about the week being bid on (`currentBidWeek`, next
// week), the one Jobs, Drivers and Lists open on. Each line is read on its own
// and a failure only drops that line (logged): the hub must always load.

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

async function jobsStatus(week) {
  const [jobs, hidden] = await Promise.all([getCoverBidJobsByWeek(week), getHiddenJobKeys(week)]);
  if (jobs.length === 0) return 'Not posted yet';
  const shown = jobs.filter((job) => !isJobHidden(job, hidden));
  const open = shown.filter((job) => !isPicked(job)).length;
  return `${plural(shown.length, 'job')} · ${open} open`;
}

async function driversStatus(week) {
  const picks = await getCoverBidPicks(week);
  if (!picks?.rows?.length) return 'Pick list not posted yet';
  const { cover, onCall } = coverDriversFromPicks(picks.rows);
  const working = cover.filter((driver) => driver.status === 'in').length;
  return `${working} cover · ${onCall.length} on call`;
}

async function listsStatus(week) {
  const count = await countWeekCoverLists(week);
  return count === 0 ? 'No lists yet' : plural(count, 'list');
}

async function historyStatus(week) {
  const weeks = (await getCoverBidJobWeeks()).filter((weekEnding) => weekEnding <= week);
  return weeks.length === 0 ? 'No weeks saved yet' : `${plural(weeks.length, 'week')} saved`;
}

// Open reports, any week: they count until an admin closes them.
async function reportsStatus() {
  const { count } = await getOpenCoverReportSummary();
  return count === 0 ? 'Nothing open' : `${count} open`;
}

const STATUS = {
  jobs: jobsStatus,
  drivers: driversStatus,
  lists: listsStatus,
  history: historyStatus,
  reports: reportsStatus,
};

// → { week: 'YYYY-MM-DD', weekLabel: 'MM/DD/YYYY', lines: { [key]: string } }
export async function getCoverHubStatus() {
  const week = currentBidWeek(todayInNewYork());
  const entries = await Promise.all(
    Object.entries(STATUS).map(async ([key, load]) => {
      try {
        return [key, await load(week)];
      } catch (error) {
        console.error(`Error loading the Covers hub's ${key} status:`, error);
        return [key, null];
      }
    }),
  );
  return {
    week,
    weekLabel: formatWeekEnding(week),
    lines: Object.fromEntries(entries.filter(([, line]) => line)),
  };
}
