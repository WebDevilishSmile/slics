import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/authz';
import { clearUserDriver, setUserDriver } from '@/lib/db/driverClaims';

// An account's driver verification, from the admin user page
// (docs/COVER-BIDDING.md). Both answer with only what that page shows.
const driverOf = (user) => ({
  driverVerified: Boolean(user.driver?.verifiedAt),
  driverName: user.driver?.name ?? null,
  verifiedAt: user.driver?.verifiedAt ?? null,
  verifiedBy: user.driver?.verifiedBy?.name ?? null,
});

// PUT `{ name }`: link the account to the driver as the sheet spells their
// name, or change the spelling (the sheet changed it). Verifies without a
// claim, e.g. someone the admin checked in person.
export async function PUT(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  try {
    const result = await setUserDriver(id, body?.name, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: driverOf(result.user) });
  } catch (error) {
    console.error('Error verifying a driver:', error);
    return NextResponse.json({ error: "Couldn't save the driver." }, { status: 500 });
  }
}

// DELETE: take the verification away.
export async function DELETE(request, { params }) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  try {
    const result = await clearUserDriver(id, session.user);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    return NextResponse.json({ success: true, data: driverOf(result.user) });
  } catch (error) {
    console.error('Error removing a driver verification:', error);
    return NextResponse.json(
      { error: "Couldn't remove the verification." },
      { status: 500 },
    );
  }
}
