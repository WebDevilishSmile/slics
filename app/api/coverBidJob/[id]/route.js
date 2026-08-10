import { updateCoverBidJob, deleteCoverBidJob } from '@/utils/coverBidJobsApi';
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );

  const { id } = await params;

  try {
    const updates = await request.json();
    await updateCoverBidJob(id, updates, session.user);

    return NextResponse.json({ message: 'Cover bid job updated successfully' });
  } catch (error) {
    console.error('Error updating cover bid job:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'admin')
    return NextResponse.json(
      { error: 'Forbidden: Admin access required' },
      { status: 403 }
    );

  const { id } = await params;

  try {
    const result = await deleteCoverBidJob(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting cover bid job:', error);

    if (error.message?.includes('not found')) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
