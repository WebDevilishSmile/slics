import { updateCoverBidJob, deleteCoverBidJob } from '@/lib/db/coverBidJobs';
import { requireAdmin } from '@/lib/authz';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

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
  const { denied } = await requireAdmin();
  if (denied) return denied;

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
