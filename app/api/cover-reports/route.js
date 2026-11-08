import { after, NextResponse } from 'next/server';
import { requireArea, requireCovers } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifyCoverReport } from '@/lib/pushEvents';
import { getUserById } from '@/lib/db/users';
import {
  createCoverReport,
  getOpenCoverReportSummary,
  validateCoverReport,
} from '@/lib/db/coverReports';

// Per driver, not per network: drivers share the building's wifi.
const REPORT_LIMIT = 5;
const REPORT_WINDOW_MS = 60 * 60 * 1000; // an hour

// POST `{ weekEnding, kind, jobNumber?, note? }`: "Report a problem" on
// /covers (docs/COVER-BIDDING.md "Reference only and cover reports"). Anyone
// Covers lets in. The sheet name the account is linked to is read here, never
// taken from the body.
export async function POST(request) {
  const { session, denied } = await requireCovers();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `cover-report:${session.user.id}`,
    limit: REPORT_LIMIT,
    windowMs: REPORT_WINDOW_MS,
  });
  if (!rate.ok) {
    return NextResponse.json(
      { error: "You've sent a lot of reports. Please try again later." },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSeconds) } },
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }
  const { report, error } = validateCoverReport(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const user = await getUserById(session.user.id);
    const result = await createCoverReport({
      ...report,
      userId: session.user.id,
      driverName: user?.driver?.name ?? null,
    });
    // A push to the admins who chose it, after the response
    // (docs/PUSH-NOTIFICATIONS.md). Only for a new report: the week and the
    // kind, never the driver's name, job or note.
    if (!result.updated) {
      after(() =>
        notifyCoverReport({ weekEnding: report.weekEnding, kind: report.kind, except: session.user.id }),
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving a cover report:', error);
    return NextResponse.json(
      { error: "Couldn't send your report. Please try again." },
      { status: 500 },
    );
  }
}

// GET: the open reports' count and weeks, for the admin menu badge
// (lib/coverReportsStore.js): `{ success, data: { count, weeks } }`.
export async function GET() {
  const { denied } = await requireArea('covers');
  if (denied) return denied;

  try {
    return NextResponse.json({ success: true, data: await getOpenCoverReportSummary() });
  } catch (error) {
    console.error('Error counting open cover reports:', error);
    return NextResponse.json({ error: "Couldn't load the reports." }, { status: 500 });
  }
}
