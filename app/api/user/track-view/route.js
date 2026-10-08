// Old path, renamed on 2026-10-08 (docs/STRUCTURE.md #31). Kept as an alias so an
// app that loaded before the rename (an installed app can stay open for days)
// keeps working. Delete this file once the trial period is over.
// Segment config can't be re-exported, so runtime is repeated here.
export const runtime = 'nodejs';
export { POST } from '@/app/api/users/me/track-view/route';
