import { NextResponse } from 'next/server';

import { requireSuperAdmin } from '@/lib/authz';
import { addTypedBuildingToHubs, dismissTypedBuilding, mergeTypedBuilding } from '@/lib/db/homeBase';
import { parseTypedBuildingKey, validateHomeBaseInput, validateHubEntry } from '@/lib/homeBase';

// A building drivers typed in that the All Hubs list doesn't have
// (docs/MULTI-HUB.md "Home base", step 4), on the super admin's Home
// buildings table. `[key]` is "ALPHA-NUMBER" (typedBuildingKey). Super admin
// only; each is written to `admin_audit` first.
//   POST   { numSlic, alphaSlic, street, city, state, zip, phone? }
//          Add to All Hubs: the checked building goes on the list (and /hubs),
//          and its accounts move to it. → { moved }
//   PUT    { numSlic, alphaSlic }  Same as: it's that listed building. → { moved }
//   DELETE Not a hub: its accounts are asked again. → { cleared }

async function start(params) {
  const { session, denied } = await requireSuperAdmin();
  if (denied) return { denied };
  const { key } = await params;
  const from = parseTypedBuildingKey(key);
  if (!from) return { denied: NextResponse.json({ error: 'Unknown building.' }, { status: 400 }) };
  return { session, from };
}

const fail = (label, error) => {
  console.error(`API Error: home-buildings ${label}:`, error);
  return NextResponse.json({ error: "Couldn't save that. Please try again." }, { status: 500 });
};

export async function POST(request, { params }) {
  const { session, from, denied } = await start(params);
  if (denied) return denied;
  const { value, error } = validateHubEntry(await request.json().catch(() => null));
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const result = await addTypedBuildingToHubs(from, value, session.user);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ moved: result.moved });
  } catch (saveError) {
    return fail('POST', saveError);
  }
}

export async function PUT(request, { params }) {
  const { session, from, denied } = await start(params);
  if (denied) return denied;
  const { value, error } = validateHomeBaseInput(await request.json().catch(() => null));
  if (error) return NextResponse.json({ error }, { status: 400 });
  try {
    const result = await mergeTypedBuilding(from, value, session.user);
    if (result.error) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ moved: result.moved });
  } catch (saveError) {
    return fail('PUT', saveError);
  }
}

export async function DELETE(request, { params }) {
  const { session, from, denied } = await start(params);
  if (denied) return denied;
  try {
    return NextResponse.json(await dismissTypedBuilding(from, session.user));
  } catch (saveError) {
    return fail('DELETE', saveError);
  }
}
