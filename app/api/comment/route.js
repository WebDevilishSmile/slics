// Old path, renamed on 2026-10-08 (docs/STRUCTURE.md #29). Kept as an alias so an
// app that loaded before the rename (an installed app can stay open for days)
// keeps working. Delete this file once the trial period is over.
import { DELETE as deleteById } from '@/app/api/comments/[id]/route';

export { POST } from '@/app/api/comments/route';

// DELETE `{ commentId }` took the id in the body; the same delete now lives at
// DELETE /api/comments/[id], which validates the id and checks ownership.
export async function DELETE(request) {
  const { commentId } = (await request.json().catch(() => null)) ?? {};
  return deleteById(request, { params: Promise.resolve({ id: commentId }) });
}
