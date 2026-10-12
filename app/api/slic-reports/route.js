import { after, NextResponse } from 'next/server';
import { requireAdmin, requireUser } from '@/lib/authz';
import { checkRateLimit } from '@/lib/rateLimit';
import { notifySlicReport } from '@/lib/pushEvents';
import {
  createSlicReport,
  getOpenReportSummary,
  validateSlicReport,
} from '@/lib/db/slicReports';

// Per driver, not per network: drivers share the building's wifi.
const REPORT_LIMIT = 5;
const REPORT_WINDOW_MS = 60 * 60 * 1000; // an hour

// POST `{ numSlic, kind, note }`: a driver reports something wrong with a
// SLIC (RECOMMENDATIONS.md #5). Any signed-in driver.
export async function POST(request) {
  const { session, denied } = await requireUser();
  if (denied) return denied;

  const rate = await checkRateLimit({
    key: `slic-report:${session.user.id}`,
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
  const { report, error } = validateSlicReport(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  try {
    const result = await createSlicReport({ ...report, userId: session.user.id });
    if (result.notFound) {
      return NextResponse.json({ error: 'That SLIC no longer exists.' }, { status: 404 });
    }
    // A push to the admins who chose it, after the response
    // (docs/PUSH-NOTIFICATIONS.md). Only for a new report, and never the
    // driver's note: a lock screen isn't private.
    if (!result.updated) {
      after(() =>
        notifySlicReport({ numSlic: report.numSlic, kind: report.kind, except: session.user.id }),
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving a SLIC report:', error);
    return NextResponse.json(
      { error: "Couldn't send your report. Please try again." },
      { status: 500 },
    );
  }
}

// GET: the open reports' count and SLICs, for the admin menu badge
// (lib/slicReportsStore.js): `{ success, data: { count, slics } }`.
export async function GET() {
  const { denied } = await requireAdmin();
  if (denied) return denied;

  try {
    return NextResponse.json({ success: true, data: await getOpenReportSummary() });
  } catch (error) {
    console.error('Error counting open SLIC reports:', error);
    return NextResponse.json({ error: "Couldn't load the reports." }, { status: 500 });
  }
}
