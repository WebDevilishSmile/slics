import { requireArea, requireUser } from '@/lib/authz';
import { after, NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';
import { createSlic, getAllSlics } from '@/lib/db/slics';
import { notifySlicEdit } from '@/lib/pushEvents';

// GET every slic. Any signed-in user may read. Nothing in the app calls this
// today (pages load slics server-side via getAllSlics), so it exists for
// tooling and external clients — which is exactly why it must not be open:
// this is the whole address/phone dataset the sign-in gate protects.
export async function GET() {
  const { denied } = await requireUser();
  if (denied) return denied;

  try {
    const slics = await getAllSlics();
    return NextResponse.json(slics);
  } catch (error) {
    console.error('Error fetching slics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// POST — create a slic (admin only). Was /api/newSlic until 2026-10-08.
export async function POST(request) {
  try {
    const { session, denied } = await requireArea('slics');
    if (denied) return denied;

    const body = await request.json();
    const newSlic = await createSlic(body, session.user);
    // A push to the other admins who chose SLIC edits, after the response.
    after(() =>
      notifySlicEdit({ numSlic: newSlic.numSlic, action: 'created', except: session.user.id, byRole: session.user.role }),
    );

    return NextResponse.json(
      {
        success: true,
        data: newSlic,
        message: 'Slic created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('API Error creating slic:', error);
    return errorResponse(error, "Couldn't create the SLIC. Please try again.");
  }
}
