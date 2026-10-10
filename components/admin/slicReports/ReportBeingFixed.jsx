'use client';

import dayjs from 'dayjs';
import { OutlinedFlag } from '@mui/icons-material';
import { Box } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { reportKindLabel } from './reportText';

// Above the edit form when it was opened from /admin/reports' Fix: what the
// driver said, and that saving resolves it (slicForm/FormActions.jsx).
export default function ReportBeingFixed({ report }) {
  return (
    <SoftNotice icon={<OutlinedFlag />} sx={{ mb: 3 }}>
      <strong>{reportKindLabel(report.kind)}</strong>, reported by{' '}
      {report.reporter ?? 'a deleted account'} on{' '}
      {dayjs(report.updated_at ?? report.created_at).format('MMM D, YYYY')}.
      {report.note && (
        // Spans, not a block: SoftNotice puts its message in a <p>.
        <Box component='span' sx={{ display: 'block', mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          “{report.note}”
        </Box>
      )}
      <Box component='span' sx={{ display: 'block', mt: 1, color: 'text.secondary' }}>
        Updating the SLIC marks this report fixed.
      </Box>
    </SoftNotice>
  );
}
