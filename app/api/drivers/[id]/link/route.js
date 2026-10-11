import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { linkDriver, unlinkDriver } from '@/lib/db/drivers';

// A roster row's link to a driver on the on-call sheet (lib/driverRoster.js),
// by the name as the sheet spells it. Admin only.

async function readName(request) {
  try {
    const body = await request.json();
    return typeof body?.name === 'string' ? body.name : '';
  } catch {
    return null;
  }
}

async function respond(action) {
  try {
    const result = await action();
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing a roster link:', error);
    return NextResponse.json({ error: "Couldn't save the link." }, { status: 500 });
  }
}

// PUT `{ name }`: this roster row is that driver on the sheet.
export async function PUT(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const name = await readName(request);
  if (name === null) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  return respond(() => linkDriver(id, name));
}

// DELETE `{ name }`: not that driver. Unlinks, and stops the pair from
// matching or being suggested again.
export async function DELETE(request, { params }) {
  const { denied } = await requireAdmin();
  if (denied) return denied;
  const { id } = await params;
  const name = await readName(request);
  if (name === null) return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  return respond(() => unlinkDriver(id, name));
}
