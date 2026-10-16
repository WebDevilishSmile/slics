import { updateCoverBidJob, deleteCoverBidJob } from '@/lib/db/coverBidJobs';
import { requireArea } from '@/lib/authz';
import { NextResponse } from 'next/server';
import { errorResponse } from '@/lib/httpError';

export async function PATCH(request, { params }) {
  const { session, denied } = await requireArea('covers');
  if (denied) return denied;

  const { id } = await params;

  try {
    const updates = await request.json();
    await updateCoverBidJob(id, updates, session.user);

    return NextResponse.json({ message: 'Cover bid job updated successfully' });
  } catch (error) {
    console.error('Error updating cover bid job:', error);
    return errorResponse(error, "Couldn't save the job.");
  }
}

export async function DELETE(request, { params }) {
  const { denied } = await requireArea('covers');
  if (denied) return denied;

  const { id } = await params;

  try {
    const result = await deleteCoverBidJob(id);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting cover bid job:', error);
    return errorResponse(error, "Couldn't delete the job.");
  }
}
