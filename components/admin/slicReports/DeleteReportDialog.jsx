'use client';

import { useState } from 'react';
import { Close } from '@mui/icons-material';
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { reportKindLabel, reportSlicName } from './reportText';

// "Delete" on a report in the /admin/reports queue, for test reports and ones
// filed by mistake. A real report is closed with Fix or Dismiss instead.
// `onDeleted` gets the id. Mounted only while open.
export default function DeleteReportDialog({ report, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    const { error } = await apiRequest(`/api/slic-reports/${report._id}`, { method: 'DELETE' });
    setDeleting(false);
    // Already gone is what was asked for.
    if (error && error !== 'That report is already gone.') return setError(error);
    onDeleted(report._id);
  };

  return (
    <Dialog open onClose={deleting ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle sx={{ pr: 7 }}>Delete this report?</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={deleting}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}>
          {reportSlicName(report)} · {reportKindLabel(report.kind)}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          It leaves the queue and the activity feed for good. Use this for test reports. To
          close a real one, use Fix or Dismiss, which keep it.
        </Typography>
        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button
          onClick={onClose}
          disabled={deleting}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Cancel
        </Button>
        <Button
          onClick={handleDelete}
          variant='contained'
          color='error'
          disabled={deleting}
          startIcon={deleting ? <CircularProgress size={16} color='inherit' /> : null}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
