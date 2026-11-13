import { after, NextResponse } from 'next/server';
import { requireArea } from '@/lib/authz';
import { recordAdminAction } from '@/lib/db/adminAudit';
import {
  approveRouteSuggestion,
  declineRouteSuggestion,
  deleteRouteSuggestion,
  getRouteSuggestionSummary,
} from '@/lib/db/routeSuggestions';
import { notifySlicEdit } from '@/lib/pushEvents';

// The queue on /admin/routes (docs/SLIC-DIRECTIONS.md, stage 2). Approving
// edits the SLIC's route, so it's the SLICs area's (docs/archive/STAFF-ROLES.md).

// PATCH `{ action: 'approve', text }` (the suggestion as the admin left it
// becomes the route) or `{ action: 'decline', answer }`.
export async function PATCH(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    if (body?.action === 'approve') {
      const result = await approveRouteSuggestion(id, body.text, session.user);
      if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
      if (result.changed) {
        after(() =>
          notifySlicEdit({
            numSlic: result.suggestion.numSlic,
            action: 'route',
            except: session.user.id,
            byRole: session.user.role,
          }),
        );
      }
      return NextResponse.json({ success: true, data: result.suggestion });
    }
    if (body?.action === 'decline') {
      const result = await declineRouteSuggestion(id, body.answer, session.user);
      if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json({ success: true, data: result.suggestion });
    }
    return NextResponse.json({ error: 'Approve or decline?' }, { status: 400 });
  } catch (error) {
    console.error('Error deciding a route suggestion:', error);
    return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
  }
}

// DELETE — removes a suggestion for good (a test one). On record first.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const { id } = await params;
  try {
    const summary = await getRouteSuggestionSummary(id);
    if (!summary) return NextResponse.json({ error: 'That suggestion is already gone.' }, { status: 404 });
    await recordAdminAction({
      actor: session.user,
      action: 'routeSuggestion.deleted',
      targetType: 'route-suggestion',
      targetId: summary._id,
      targetName: null,
      from: summary.text,
      to: null,
    });
    await deleteRouteSuggestion(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting a route suggestion:', error);
    return NextResponse.json({ error: "Couldn't delete it. Please try again." }, { status: 500 });
  }
}
