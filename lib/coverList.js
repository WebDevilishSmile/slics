import { COVER_LIST_MAX } from '@/constants';
import { isJobHidden, isPicked, jobKey } from '@/lib/coverBidJobRow';

// A driver's cover list (docs/COVER-BIDDING.md, stage 2): the jobs they want
// for one week, in order, as entries `{ jobKey, jobNumber }`. By job number,
// never the job's _id, because every sheet refresh replaces the job rows (the
// same reason hides are keyed this way, docs/COVER-JOB-HIDING.md). Shared by
// the server and the /covers page.

// The entries for a list of job numbers as typed or sent: trimmed, without
// blanks or repeats (by jobKey, the first one stays), at most COVER_LIST_MAX.
export function cleanCoverList(jobNumbers) {
  const seen = new Set();
  const entries = [];
  for (const raw of jobNumbers ?? []) {
    if (typeof raw !== 'string') continue;
    const key = jobKey(raw);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    entries.push({ jobKey: key, jobNumber: raw.trim() });
    if (entries.length === COVER_LIST_MAX) break;
  }
  return entries;
}

// `weekJobs` by jobKey (the first job with a number wins, as the sheet lists
// them).
function jobsByKey(weekJobs) {
  const byKey = new Map();
  for (const job of weekJobs ?? []) {
    const key = jobKey(job.jobNumber);
    if (key && !byKey.has(key)) byKey.set(key, job);
  }
  return byKey;
}

// Each entry with where its job stands now:
// - 'open': still there to pick;
// - 'picked': someone took it (on the sheet, or later in the app);
// - 'gone': no longer in the week's jobs, or hidden from drivers (an admin's
//   hide, or an automatic one: a row the sheet hides, a sleeper job).
// A list keeps every entry; only reading it drops the taken ones, so a job
// that opens up again (the sheet is corrected) comes back in its place.
// `hiddenKeys` is a Set of hideKeys; the driver's page passes jobs that are
// already filtered and no Set.
export function coverListStatus(entries, weekJobs, weekEnding, hiddenKeys = new Set()) {
  const byKey = jobsByKey(weekJobs);
  return (entries ?? []).map((entry) => {
    const job = byKey.get(entry.jobKey);
    let status = 'open';
    if (!job || isJobHidden({ ...job, weekEnding }, hiddenKeys)) status = 'gone';
    else if (isPicked(job)) status = 'picked';
    return { ...entry, status };
  });
}

// For admins: how many drivers' lists hold each still-open job, and on how
// many it's the first open choice (who would ask for it first if their turn
// came now). A Map of jobKey → { lists, first }.
export function coverListDemand(lists, weekJobs, weekEnding, hiddenKeys = new Set()) {
  const demand = new Map();
  for (const list of lists) {
    const open = coverListStatus(list.entries, weekJobs, weekEnding, hiddenKeys).filter(
      (entry) => entry.status === 'open',
    );
    open.forEach((entry, index) => {
      const count = demand.get(entry.jobKey) ?? { lists: 0, first: 0 };
      count.lists += 1;
      if (index === 0) count.first += 1;
      demand.set(entry.jobKey, count);
    });
  }
  return demand;
}
