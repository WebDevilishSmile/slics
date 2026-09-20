import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import { getAllSlics } from '@/utils/slicsApi';

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
