import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { createSlic, getAllSlics } from '@/lib/db/slics';

// GET every slic. Any signed-in user may read. Nothing in the app calls this
// today (pages load slics server-side via getAllSlics), so it exists for
// tooling and external clients — which is exactly why it must not be open:
// this is the whole address/phone dataset the sign-in gate protects.
export async function GET() {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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
    const session = await auth();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const newSlic = await createSlic(body, session.user);

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
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }
}
