import { SLIC_REPORT_KINDS } from '@/constants';

const LABELS = Object.fromEntries(SLIC_REPORT_KINDS.map(({ value, label }) => [value, label]));

// A report's kind as a label ("Wrong phone number").
export const reportKindLabel = (kind) => LABELS[kind] ?? 'Something else';

// How a report's SLIC is named: "LV56 (1234)", or just the number when the
// SLIC is gone.
export const reportSlicName = (report) =>
  report.slicLabel ? `${report.slicLabel} (${report.numSlic})` : report.numSlic;
