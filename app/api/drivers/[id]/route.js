import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { deleteDriver, updateDriver, validateDriverFields } from '@/lib/db/drivers';

// PATCH any of `{ name, employeeId, seniorityDate, phone }` on a roster row.
// Nothing else in the body is written (SECURITY.md #10). Admin only.
export async function PATCH(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { fields, error } = validateDriverFields(body, { partial: true });
  if (error) return NextResponse.json({ error }, { status: 400 });
  if (Object.keys(fields).length === 0) {
    return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 });
  }

  try {
    const result = await updateDriver(id, fields);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ message: 'Updated successfully' });
  } catch (error) {
    console.error('Error updating a driver:', error);
    return NextResponse.json({ error: "Couldn't save the driver." }, { status: 500 });
  }
}

// DELETE a roster row. Admin only.
export async function DELETE(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const result = await deleteDriver(id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting driver:', error);
    return NextResponse.json({ error: "Couldn't delete the driver." }, { status: 500 });
  }
}
