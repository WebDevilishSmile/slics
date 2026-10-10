import { requireAdmin } from '@/lib/authz';
import { NextResponse } from 'next/server';
import { createGym, validateGym } from '@/lib/db/gyms';

// Every /api/gyms* and /api/gym-comments* route is admin-only: the Planet
// Fitness page (app/admin/planet-fitness) is the admin's personal list.

// POST a new gym
export async function POST(request) {
  const { session, denied } = await requireAdmin();
  if (denied) return denied;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { gym, error } = validateGym(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const _id = await createGym(gym, session.user);
    return NextResponse.json({ _id }, { status: 201 });
  } catch (error) {
    console.error('Error creating gym:', error);
    return NextResponse.json(
      { error: 'Could not save the gym. Please try again.' },
      { status: 500 },
    );
  }
}
