import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { createDriver, validateDriverFields } from '@/lib/db/drivers';

// POST `{ name, employeeId, seniorityDate, phone, sheetName? }`: a roster row
// (admin only). `sheetName` links it to that driver on the on-call sheet
// ("Add details" on /admin/drivers).
export async function POST(request) {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { fields, error } = validateDriverFields(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await createDriver(fields, {
      sheetName: typeof body.sheetName === 'string' ? body.sheetName : '',
    });
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ _id: result.driver._id.toString() }, { status: 201 });
  } catch (error) {
    console.error('Error adding a driver:', error);
    return NextResponse.json({ error: "Couldn't add the driver." }, { status: 500 });
  }
}
