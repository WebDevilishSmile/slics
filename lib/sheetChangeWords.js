// What changed on the on-call sheet, in a push notification's words
// (lib/pushEvents.js). Pure, so it can be checked in plain Node.
//
// The change logs (`sheet-job-changes`, `cover-job-changes`) hold every step:
// dispatch types a job in cell by cell, moves rows, fixes a typo and undoes
// it. A notification says where each job ended up since the reader last
// looked, not the steps: a job typed in and deleted says nothing, one that
// left and came back says nothing, a time changed and changed back says
// nothing.

// How many jobs a push names before it only counts them.
export const JOBS_NAMED = 3;
export const listOf = new Intl.ListFormat('en', { style: 'long', type: 'conjunction' });
export const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

// A changed field as a push says it: what kind of thing changed, never the
// value (a value can be a driver's name or why they're off).
const FIELD_WORDS = {
  driver: 'driver',
  seniority: 'seniority',
  description: 'description',
  name: 'name',
  assignedDriver: 'assigned driver',
  coverReason: 'cover reason',
};
// A day's start, hours or miles ('mon.start' on the Jobs tab, 'mon' on a
// cover tab) and the week's hours: the Changes feed's "Times" group.
const isTimeField = (field) => /^(sun|mon|tue|wed|thu|fri|sat)(\.|$)/.test(field ?? '') || field === 'weekHours';

const same = (a, b) => String(a ?? '').trim() === String(b ?? '').trim();

// One job's change rows, oldest first → 'added', 'removed', what changed
// ("times changed", "driver and description changed"), or null when the job
// ended where it started. A row with no `from`/`to` (a sample) counts as
// changed.
export function jobOutcome(rows) {
  const before = rows[0].kind !== 'added';
  const last = rows.findLast((row) => row.kind === 'added' || row.kind === 'removed');
  const after = last ? last.kind === 'added' : true;
  if (!before) return after ? 'added' : null;
  if (!after) return 'removed';

  const fields = new Map();
  for (const row of rows) {
    if (row.kind !== 'changed') continue;
    const first = fields.get(row.field);
    fields.set(row.field, { from: first ? first.from : row.from, to: row.to, known: 'from' in row && 'to' in row });
  }
  const changed = [...fields].filter(([, { from, to, known }]) => !known || !same(from, to)).map(([field]) => field);
  if (changed.length === 0) return null;
  const words = [...new Set(changed.map((field) => (isTimeField(field) ? 'times' : (FIELD_WORDS[field] ?? 'details'))))];
  return words.length <= 2 ? `${listOf.format(words)} changed` : 'changed';
}

// Change rows (newest first, as the logs are read) → [{ job, outcome }] for
// the jobs that ended up different, the most recently touched first.
// `jobOf(row)` is the row's job code: a job name on the Jobs tab, a job number
// on a cover tab. The sheet's case and spacing don't matter (cpu3 is CPU3).
export function jobOutcomes(rows, jobOf) {
  const byJob = new Map();
  for (const row of rows) {
    const job = String(jobOf(row) ?? '').trim();
    const key = job.toUpperCase();
    if (!byJob.has(key)) byJob.set(key, { job: job || 'A job', rows: [] });
    byJob.get(key).rows.unshift(row);
  }
  return [...byJob.values()]
    .map(({ job, rows: jobRows }) => ({ job, outcome: jobOutcome(jobRows) }))
    .filter(({ outcome }) => outcome);
}

// → "SH16 added, LV92 removed, and WA03 times changed", or "7 jobs added,
// 1 removed, 2 changed" past JOBS_NAMED, or '' when nothing ended up
// different. Codes only, never a driver's name.
export function describeJobs(rows, jobOf) {
  const outcomes = jobOutcomes(rows, jobOf);
  if (outcomes.length === 0) return '';
  if (outcomes.length <= JOBS_NAMED) {
    return listOf.format(outcomes.map(({ job, outcome }) => `${job} ${outcome}`));
  }
  const count = (kind) =>
    outcomes.filter(({ outcome }) => (kind === 'changed' ? outcome.endsWith('changed') : outcome === kind)).length;
  const parts = ['added', 'removed', 'changed'].map((kind) => [kind, count(kind)]).filter(([, n]) => n > 0);
  // "jobs" once, on the first count.
  return parts.map(([kind, n], index) => (index === 0 ? `${plural(n, 'job')} ${kind}` : `${n} ${kind}`)).join(', ');
}

// A job's NAME rows on a cover tab (oldest first) → how many jobs ended with
// a different name than they started: picked, released or handed to someone
// else. For the admins' "Cover picks" digest, which only counts them.
export function countPickedJobs(rows) {
  const byJob = new Map();
  for (const row of rows) {
    const key = String(row.jobNumber ?? '').trim().toUpperCase();
    const first = byJob.get(key);
    byJob.set(key, { from: first ? first.from : row.from, to: row.to });
  }
  return [...byJob.values()].filter(({ from, to }) => !same(from, to)).length;
}
