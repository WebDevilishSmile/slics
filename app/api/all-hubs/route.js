import { NextResponse } from 'next/server';

import { requireUser } from '@/lib/authz';
import { getHubChoices } from '@/lib/db/homeBase';

// GET: the All Hubs list for the home building picker
// (homeBase/HomeBasePicker.jsx, docs/MULTI-HUB.md "Home base"):
// `{ hubs: [{ numSlic, alphaSlic, town }] }`, BETPA first. Any signed-in
// driver; it's the same list /hubs shows.
export async function GET() {
  const { denied } = await requireUser();
  if (denied) return denied;

  try {
    return NextResponse.json({ hubs: await getHubChoices() });
  } catch (error) {
    console.error('API Error: all-hubs GET:', error);
    return NextResponse.json({ error: "Couldn't load the buildings." }, { status: 500 });
  }
}
