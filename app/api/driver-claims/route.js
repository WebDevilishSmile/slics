import { after, NextResponse } from 'next/server';
import { requireArea, requireCovers } from '@/lib/authz';
import { notifyDriverClaim } from '@/lib/pushEvents';
import { checkRateLimit } from '@/lib/rateLimit';
import {
  createDriverClaim,
  getPendingClaimCount,
  validateDriverClaim,
} from '@/lib/db/driverClaims';

// Per driver, not per network: drivers share the building's wifi. Editing a
// pending claim counts too.
const CLAIM_LIMIT = 5;
const CLAIM_WINDOW_MS = 24 * 60 * 60 * 1000; // a day

// POST `{ name, employeeEmail, seniorityDate }`: a driver asks to be verified
// for covers, or edits their pending claim (docs/COVER-BIDDING.md). Admins
// only until Covers rolls out (requireCovers). Responds with the claim as the
// driver sees it.
export async function POST(request) {
  const { session, denied } = await requireCovers();
  if (denied) return denied;

  if (session.user.driverVerified === true) {
    return NextResponse.json({ error: 'Your account is already verified.' }, { status: 409 });
  }

  const rate = await checkRateLimit({
    key: `driver-claim:${session.user.id}`,
    limit: CLAIM_LIMIT,
    windowMs: CLAIM_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent this a lot today. Please try again tomorrow." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { claim, error } = validateDriverClaim(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await createDriverClaim({ ...claim, userId: session.user.id });
    // A push to the admins who chose it, for a new claim only (an edit of a
    // pending one is already in the queue). Never the name or the evidence.
    if (result.created) after(() => notifyDriverClaim({ except: session.user.id }));
    return NextResponse.json({ success: true, data: result.claim });
  } catch (error) {
    console.error('Error saving a driver claim:', error);
    return NextResponse.json(
      { error: "Couldn't send your claim. Please try again." },
      { status: 500 },
    );
  }
}

// GET: how many claims are waiting, for the admin menu badge
// (lib/driverClaimsStore.js): `{ success, data: { count } }`.
export async function GET() {
  const { denied } = await requireArea('driverClaims');
  if (denied) return denied;

  try {
    return NextResponse.json({ success: true, data: { count: await getPendingClaimCount() } });
  } catch (error) {
    console.error('Error counting driver claims:', error);
    return NextResponse.json({ error: "Couldn't load the claims." }, { status: 500 });
  }
}
