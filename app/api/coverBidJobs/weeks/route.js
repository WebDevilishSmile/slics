// Old path, renamed on 2026-10-08 (docs/STRUCTURE.md #30). Kept as an alias so an
// app that loaded before the rename (an installed app can stay open for days)
// keeps working. Delete this file once the trial period is over.
export { GET } from '@/app/api/cover-bid-jobs/weeks/route';
