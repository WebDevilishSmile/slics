import { DAY_FIELDS } from '@/lib/dayFormat';
import { sortRows, startMinutes } from '@/lib/jobTable';

// Sorting and filtering a week's cover jobs on /covers
// (coverBidJobs/CoverBidJobsTable.jsx, coverBidJobs/JobFilters.jsx). Pure.

// A job's earliest start in the week, in minutes; NaN when it works no day.
export function earliestStart(job) {
  const starts = DAY_FIELDS.map((day) => startMinutes(job[day])).filter((value) => !Number.isNaN(value));
  return starts.length ? Math.min(...starts) : NaN;
}

// What each sort sorts by (sortRows, lib/jobTable.js). `first` is the
// direction of the first tap: most hours first, the rest lowest first.
// `words` say each direction for a screen reader.
export const COVER_SORTS = [
  {
    key: 'jobNumber',
    label: 'Job #',
    value: (job) => job.jobNumber ?? '',
    type: 'text',
    first: 'asc',
    words: { asc: 'A to Z', desc: 'Z to A' },
  },
  {
    key: 'weekHours',
    label: 'Week hours',
    value: (job) => parseFloat(job.weekHours),
    type: 'number',
    first: 'desc',
    words: { asc: 'fewest first', desc: 'most first' },
  },
  {
    key: 'start',
    label: 'Start time',
    value: earliestStart,
    type: 'number',
    first: 'asc',
    words: { asc: 'earliest first', desc: 'latest first' },
  },
];

// The jobs to show: `search` in the job number or description, `openOnly`
// leaving out picked jobs (`isPicked`), `days` the days a job must work (all
// of them), then `sort` (null keeps the sheet's order). Jobs with no hours
// or no start go last either way.
export function visibleCoverJobs(jobs, { search = '', openOnly = false, days = [], sort = null, isPicked }) {
  const query = search.trim().toLowerCase();
  const shown = jobs.filter(
    (job) =>
      (!query ||
        job.jobNumber?.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query)) &&
      (!openOnly || !isPicked(job)) &&
      days.every((day) => job[day]),
  );
  return sort ? sortRows(shown, COVER_SORTS, sort) : shown;
}
