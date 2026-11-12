import { requireArea, requireUser } from '@/lib/authz';
import { after, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';
import { deleteRoute, getRoute, saveRoute } from '@/lib/db/slicRoutes';
import { notifySlicEdit } from '@/lib/pushEvents';
import { validateRouteText } from '@/lib/routeText';
import { toDriverRoute } from '@/lib/serializers';

// A SLIC's directions as text (docs/SLIC-DIRECTIONS.md, stage 1), keyed by
// `?slic=<numSlic>` like /api/comments: `/api/slics/[id]` means the _id.

const numSlicOf = (value) => (typeof value === 'string' && /^[0-9A-Za-z]{1,10}$/.test(value) ? value : null);

// GET ?slic= — the route for the directions sheet: `{ route }`, null when the
// SLIC has none.
export async function GET(request) {
  const { denied } = await requireUser();
  if (denied) return denied;

  const numSlic = numSlicOf(request.nextUrl.searchParams.get('slic'));
  if (!numSlic) return NextResponse.json({ error: 'Which SLIC?' }, { status: 400 });

  try {
    return NextResponse.json({ route: toDriverRoute(await getRoute(numSlic)) });
  } catch (error) {
    console.error('Error loading a route:', error);
    return NextResponse.json({ error: "Couldn't load the directions. Please try again." }, { status: 500 });
  }
}

// PUT `{ numSlic, text }` — saves the route (the SLIC edit page's Route
// section). Saving is approving: the route says who and when.
export async function PUT(request) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  try {
    const body = await request.json();
    const numSlic = numSlicOf(body?.numSlic);
    if (!numSlic) return NextResponse.json({ error: 'Which SLIC?' }, { status: 400 });
    const { text, error } = validateRouteText(body?.text);
    if (error) return NextResponse.json({ error }, { status: 400 });

    const { changed } = await saveRoute({ numSlic, text, source: 'admin', user: session.user });
    if (changed) {
      after(() => notifySlicEdit({ numSlic, action: 'route', except: session.user.id, byRole: session.user.role }));
    }
    return NextResponse.json({ changed });
  } catch (error) {
    console.error('Error saving a route:', error);
    return errorResponse(error, "Couldn't save the directions. Please try again.");
  }
}

// DELETE ?slic= — takes the route off; the card falls back to the PDF.
export async function DELETE(request) {
  const { session, denied } = await requireArea('slics');
  if (denied) return denied;

  const numSlic = numSlicOf(request.nextUrl.searchParams.get('slic'));
  if (!numSlic) return NextResponse.json({ error: 'Which SLIC?' }, { status: 400 });

  try {
    const { deleted } = await deleteRoute({ numSlic, user: session.user });
    if (deleted) {
      after(() => notifySlicEdit({ numSlic, action: 'route', except: session.user.id, byRole: session.user.role }));
    }
    return NextResponse.json({ deleted });
  } catch (error) {
    console.error('Error deleting a route:', error);
    return errorResponse(error, "Couldn't remove the directions. Please try again.");
  }
}
