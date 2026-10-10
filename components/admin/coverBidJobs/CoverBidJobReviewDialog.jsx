'use client';

import { useId } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { isDuplicateJobNumber } from '@/lib/coverBidJobRow';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import CoverBidJobFields from './CoverBidJobFields';

const squareButtonSx = [softRaisedSmall, softPressSx, { width: '3rem', height: '3rem' }];

// Reviews and edits the week's jobs one at a time, at full size, stepping
// through them in sheet order. Full screen on a phone. Used by the saved week
// (CoverBidJobsManager):
// - `index` is the open job, or null when closed;
// - `status(row)` is a short line under the title (unsaved changes);
// - `onDelete(row)` drops the job, after which the next one shows;
// - `renderPrimary(row, index)` is the one contained button (Save);
// - `footer(row)` is optional content under the fields (who picked the job).
export default function CoverBidJobReviewDialog({
  rows,
  index,
  onIndexChange,
  onClose,
  onFieldChange,
  duplicates,
  status,
  onDelete,
  renderPrimary,
  footer,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const titleId = useId();

  // A delete can leave `index` past the end; show the last job instead.
  const current =
    index == null || rows.length === 0 ? null : Math.min(index, rows.length - 1);
  const row = current == null ? null : rows[current];

  const jobLabel = row?.jobNumber ? `job ${row.jobNumber}` : 'this job';

  return (
    <Dialog
      open={row != null}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth='sm'
      aria-labelledby={titleId}
      sx={{ '& .MuiDialog-paper': fullScreen ? { borderRadius: 0 } : {} }}
    >
      {row && (
        <>
          <DialogTitle id={titleId} sx={{ pr: 8 }}>
            <Box component='span' aria-live='polite' sx={{ display: 'block' }}>
              Job {current + 1} of {rows.length}
              {row.jobNumber && ` · ${row.jobNumber}`}
            </Box>
            {status && (
              <Box component='span' sx={{ display: 'block', mt: 0.5 }}>
                {status(row)}
              </Box>
            )}
          </DialogTitle>
          <IconButton
            onClick={onClose}
            aria-label='Close'
            sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
          >
            <CloseIcon />
          </IconButton>

          <DialogContent>
            {/* Room around the fields so their wells' shadows aren't clipped. */}
            <Box sx={{ pt: 1 }}>
              <CoverBidJobFields
                key={row.key}
                row={row}
                onChange={(field, value) => onFieldChange(row.key, field, value)}
                duplicate={isDuplicateJobNumber(row, duplicates)}
              />
              {footer?.(row)}
            </Box>
          </DialogContent>

          <DialogActions disableSpacing sx={{ px: 3, pt: 2, pb: 3, gap: 1.5 }}>
            <Tooltip title='Previous job'>
              <span>
                <IconButton
                  aria-label='Previous job'
                  onClick={() => onIndexChange(current - 1)}
                  disabled={current === 0}
                  sx={squareButtonSx}
                >
                  <ChevronLeftIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title='Next job'>
              <span>
                <IconButton
                  aria-label='Next job'
                  onClick={() => onIndexChange(current + 1)}
                  disabled={current === rows.length - 1}
                  sx={squareButtonSx}
                >
                  <ChevronRightIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Box sx={{ flex: 1 }} />
            <Tooltip title={`Delete ${jobLabel}`}>
              <IconButton
                aria-label={`Delete ${jobLabel}`}
                onClick={() => onDelete(row)}
                sx={[...squareButtonSx, { color: 'error.main' }]}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
            {renderPrimary(row, current)}
          </DialogActions>
        </>
      )}
    </Dialog>
  );
}
