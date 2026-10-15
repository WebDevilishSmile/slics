'use client';

import { useState } from 'react';
import Link from '@/components/utility/NextLink';
import dayjs from 'dayjs';
import { BuildOutlined, CheckCircleOutline, DeleteOutline } from '@mui/icons-material';
import { Alert, Box, Button, IconButton, Paper, Tooltip, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { setOpenReportsCount } from '@/lib/slicReportsStore';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';
import DeleteReportDialog from './DeleteReportDialog';
import { reportKindLabel, reportSlicName } from './reportText';

const when = (iso) => (iso ? dayjs(iso).format('MMM D, YYYY h:mm A') : '');
const STATUS_LABELS = { resolved: 'Fixed', dismissed: 'Dismissed' };

function OpenReport({ report, index, busy, onDismiss, onDelete }) {
  return (
    <Box
      component='li'
      className='enter'
      sx={[
        softRaised,
        { '--i': index, borderRadius: 4, p: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 },
      ]}
    >
      <Box>
        <Typography variant='h6' component='h3'>
          {reportSlicName(report)}
        </Typography>
        <Typography variant='body2' sx={{ color: 'primary.main', fontWeight: 600 }}>
          {reportKindLabel(report.kind)}
        </Typography>
      </Box>

      {report.note && (
        // Plain text, never HTML.
        <Typography
          sx={[
            softInset,
            { borderRadius: 3, p: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
          ]}
        >
          {report.note}
        </Typography>
      )}

      <Typography variant='caption' color='text.secondary'>
        {report.reporter ?? 'A deleted account'} · {when(report.updated_at ?? report.created_at)}
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5 }}>
        {/* For test reports; a real one is closed with Dismiss or Fix. */}
        <Button
          onClick={() => onDelete(report)}
          disabled={busy}
          startIcon={<DeleteOutline />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem', mr: 'auto', color: 'error.main' }]}
        >
          Delete
        </Button>
        <Button
          onClick={() => onDismiss(report)}
          disabled={busy}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Dismiss
        </Button>
        {/* Saving the edit form resolves the report (slicForm/FormActions.jsx). */}
        <Button
          component={Link}
          href={`/admin/edit/${encodeURIComponent(report.numSlic)}?report=${report._id}`}
          variant='contained'
          startIcon={<BuildOutlined />}
          disabled={busy || !report.slicLabel}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Fix
        </Button>
      </Box>
    </Box>
  );
}

// The admin queue of driver reports (RECOMMENDATIONS.md #5): open reports,
// oldest first, then the last few closed ones. Fix opens the SLIC's edit form,
// whose save resolves the report; Dismiss closes one that needs no change;
// Delete removes a test report for good (DeleteReportDialog).
export default function SlicReportsQueue({ initialOpen, initialClosed }) {
  const [open, setOpen] = useState(initialOpen);
  const [closed, setClosed] = useState(initialClosed);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  // The report the delete dialog is asking about, or null.
  const [deleting, setDeleting] = useState(null);

  const handleDeleted = (id) => {
    const nextOpen = open.filter((item) => item._id !== id);
    setOpen(nextOpen);
    setClosed(closed.filter((item) => item._id !== id));
    setOpenReportsCount(nextOpen.length);
    setDeleting(null);
  };

  const changeStatus = async (report, status) => {
    setBusyId(report._id);
    setError('');
    const { data, error } = await apiRequest(`/api/slic-reports/${report._id}`, {
      method: 'PATCH',
      body: { status },
    });
    setBusyId(null);
    if (error) return setError(error);

    const updated = data.data;
    const nextOpen =
      status === 'open'
        ? [...open, updated].sort((a, b) => a.created_at.localeCompare(b.created_at))
        : open.filter((item) => item._id !== report._id);
    setOpen(nextOpen);
    setClosed(
      status === 'open'
        ? closed.filter((item) => item._id !== report._id)
        : [updated, ...closed],
    );
    setOpenReportsCount(nextOpen.length);
  };

  return (
    <Paper variant='panel' sx={{ minHeight: 0, alignItems: 'stretch', gap: 3, px: 2 }}>
      {error && <Alert severity='error'>{error}</Alert>}

      {open.length === 0 ? (
        <Box
          className='enter'
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 3 }}
        >
          <CheckCircleOutline color='primary' sx={{ fontSize: '2.5rem' }} />
          <Typography>No open reports.</Typography>
        </Box>
      ) : (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5 }}>
          {open.map((report, index) => (
            <OpenReport
              key={report._id}
              report={report}
              index={index}
              busy={busyId === report._id}
              onDismiss={(item) => changeStatus(item, 'dismissed')}
              onDelete={setDeleting}
            />
          ))}
        </Box>
      )}

      {closed.length > 0 && (
        <Box component='section' aria-labelledby='closed-reports'>
          <Typography id='closed-reports' variant='subtitle1' component='h2' sx={{ mb: 1.5 }}>
            Recently closed
          </Typography>
          <Box
            component='ul'
            sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 4, display: 'grid', gap: 1 }]}
          >
            {closed.map((report) => (
              <Box
                component='li'
                key={report._id}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2'>
                    <strong>{reportSlicName(report)}</strong> · {reportKindLabel(report.kind)}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {STATUS_LABELS[report.status]}
                    {report.closedBy ? ` by ${report.closedBy}` : ''} · {when(report.closed_at)}
                  </Typography>
                </Box>
                <Button
                  size='small'
                  onClick={() => changeStatus(report, 'open')}
                  disabled={busyId === report._id}
                  sx={[softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem', flexShrink: 0 }]}
                >
                  Reopen
                </Button>
                <Tooltip title='Delete'>
                  {/* A disabled button emits no events, so the tooltip needs a live wrapper. */}
                  <span>
                    <IconButton
                      onClick={() => setDeleting(report)}
                      disabled={busyId === report._id}
                      aria-label={`Delete the report on ${reportSlicName(report)}`}
                      sx={[softPressSx, { color: 'error.main', flexShrink: 0 }]}
                    >
                      <DeleteOutline />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {deleting && (
        <DeleteReportDialog
          report={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={handleDeleted}
        />
      )}
    </Paper>
  );
}
