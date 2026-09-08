'use client';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

/**
 * Confirms a destructive cover bid job delete.
 *
 * `request` is null when closed, otherwise either
 *   { type: 'row', row }  — delete one job
 *   { type: 'all', count, weekLabel } — delete every job for the week
 *
 * The dialog only confirms; the caller performs the delete and owns the error
 * state, which it surfaces in the manager's alert.
 */
export default function DeleteCoverBidJobsDialog({
  request,
  onCancel,
  onConfirm,
  deleting = false,
}) {
  const isAll = request?.type === 'all';

  const jobLabel = request?.row?.jobNumber
    ? `job ${request.row.jobNumber}`
    : 'this job';

  return (
    <Dialog
      open={Boolean(request)}
      onClose={deleting ? undefined : onCancel}
      aria-labelledby='delete-cover-bid-jobs-title'
      fullWidth
      maxWidth='xs'
    >
      <DialogTitle id='delete-cover-bid-jobs-title'>
        {isAll ? 'Delete all jobs for this week?' : 'Delete this job?'}
      </DialogTitle>

      <DialogContent>
        <DialogContentText>
          {isAll ? (
            <>
              This removes all {request.count} job
              {request.count === 1 ? '' : 's'} for the week ending{' '}
              <strong>{request.weekLabel}</strong>. This cannot be undone.
            </>
          ) : (
            <>
              This permanently deletes <strong>{jobLabel}</strong>. This cannot
              be undone.
            </>
          )}
        </DialogContentText>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={onConfirm}
          disabled={deleting}
          startIcon={
            deleting ? <CircularProgress size={16} color='inherit' /> : null
          }
        >
          {deleting ? 'Deleting…' : isAll ? 'Delete all' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
