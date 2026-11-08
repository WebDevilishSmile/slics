import { COVER_REPORT_KINDS } from '@/constants';
import { formatWeekEnding } from '@/lib/onCallSheet';

// How the admin pages name a cover report (lib/db/coverReports.js).

// 'times' → "Wrong start times".
export const coverReportKindLabel = (kind) =>
  COVER_REPORT_KINDS.find((entry) => entry.value === kind)?.label ?? 'Something else';

// "W/E 11/14/2026 · SH14", or the week alone.
export const coverReportTitle = (report) =>
  `W/E ${formatWeekEnding(report.weekEnding)}${report.jobNumber ? ` · ${report.jobNumber}` : ''}`;
