// Reads the "ON CALL SHEET" and prints what a refresh would save. It never
// writes, to the sheet or to MongoDB (docs/ON-CALL-SHEET-SYNC.md).
//
//   npm run sheet:preview -- 2026-10-17          # one week's cover tab
//   npm run sheet:preview -- 2026-10-17 --tabs   # also list every tab and whether it's read
//   npm run sheet:preview -- --jobs              # the Jobs tab
//
// Needs GOOGLE_SHEETS_API_KEY and ON_CALL_SHEET_ID in .env. Imports app modules
// directly (ESM), so this needs Node 22.7+, like scripts/migratePdfsToBlob.mjs.
import { getTabValues, listTabs } from '../lib/googleSheets.js';
import { parseCoverTab } from '../lib/coverSheetParser.js';
import { parseJobsTab } from '../lib/jobsSheetParser.js';
import {
  findJobsTab,
  findWeekTab,
  formatWeekEnding,
  isSaturday,
  weekEndingFromTabTitle,
} from '../lib/onCallSheet.js';

const args = process.argv.slice(2);
const showJobs = args.includes('--jobs');
const weekEnding = args.find((arg) => !arg.startsWith('--'));
if (!showJobs && !isSaturday(weekEnding)) {
  console.error('Usage: npm run sheet:preview -- YYYY-MM-DD [--tabs]   (a Saturday)');
  console.error('       npm run sheet:preview -- --jobs');
  process.exit(1);
}

const tabs = await listTabs();
const jobsTab = findJobsTab(tabs);
const dated = tabs.filter((tab) => weekEndingFromTabTitle(tab.title));
console.log(
  `${tabs.length} tabs: ${dated.length} named with a date, jobs tab ${jobsTab ? `"${jobsTab.title}"` : 'not found'}, ${tabs.length - dated.length - (jobsTab ? 1 : 0)} never read.`
);
if (args.includes('--tabs')) {
  for (const tab of tabs) {
    const week = weekEndingFromTabTitle(tab.title);
    const kind = week ? `week ${week}` : tab === jobsTab ? 'jobs' : 'not read';
    console.log(`  ${tab.title.padEnd(32)} ${kind}`);
  }
}

if (showJobs) {
  if (!jobsTab) process.exit(1);
  const rows = parseJobsTab(await getTabValues(jobsTab.title));
  console.log(`\n${rows.length} jobs, ${rows.filter((row) => !row.driver).length} without a driver`);
  console.table(
    rows.map(({ days, ...row }) => ({
      ...row,
      ...Object.fromEntries(Object.entries(days).map(([day, { start }]) => [day, start])),
    }))
  );
}

if (weekEnding) {
  const tab = findWeekTab(tabs, weekEnding);
  if (!tab) {
    console.error(`No tab named for W/E ${formatWeekEnding(weekEnding)}.`);
    process.exit(1);
  }

  const parsed = parseCoverTab(await getTabValues(tab.title));
  console.log(`\nTab "${tab.title}", title says W/E ${parsed.weekEnding}${parsed.weekEnding === weekEnding ? '' : '  ← MISMATCH, a refresh would refuse it'}`);

  console.log(`\n${parsed.jobs.length} jobs`);
  console.table(parsed.jobs);

  console.log(`\n${parsed.picks.length} pick rows`);
  console.table(
    parsed.picks.map(({ picks, ...row }) => ({
      ...row,
      ...Object.fromEntries(picks.map((pick, index) => [`#${index + 1}`, pick])),
    }))
  );
}
