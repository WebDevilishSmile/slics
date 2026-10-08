'use client';

import { useId, useState } from 'react';
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
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { isDuplicateJobNumber } from '@/lib/coverBidJobRow';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import BidSheetSourceViewer from './BidSheetSourceViewer';
import CoverBidJobFields from './CoverBidJobFields';

const squareButtonSx = [softRaisedSmall, softPressSx, { width: '3rem', height: '3rem' }];

// Reviews and edits the week's jobs one at a time, at full size, stepping
// through them in sheet order. With uploaded files (`sources`), the sheet
// sits beside the fields on a wide screen, opened at the row's own photo or
// PDF page, and behind a "Show sheet" button on a phone, where the dialog
// fills the screen. Shared by the upload drafts and the saved week:
// - `index` is the open job, or null when closed;
// - `status(row)` is a short line under the title (checked, unsaved);
// - `onDelete(row)` drops the job, after which the next one shows;
// - `renderPrimary(row, index)` is the one contained button (Looks right, Save).
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
  sources = [],
  viewerMemory,
}) {
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const titleId = useId();

  // A delete can leave `index` past the end; show the last job instead.
  const current =
    index == null || rows.length === 0 ? null : Math.min(index, rows.length - 1);
  const row = current == null ? null : rows[current];

  // Show the row's own file when the job changes; the admin can still switch.
  const [sourceIndex, setSourceIndex] = useState(row?.sourceIndex ?? 0);
  const [rowKey, setRowKey] = useState(row?.key);
  if (row && row.key !== rowKey) {
    setRowKey(row.key);
    if (row.sourceIndex != null) setSourceIndex(row.sourceIndex);
  }
  const [showSheet, setShowSheet] = useState(false);

  const hasSources = sources.length > 0;
  const sideBySide = hasSources && !fullScreen;
  const jobLabel = row?.jobNumber ? `job ${row.jobNumber}` : 'this job';

  return (
    <Dialog
      open={row != null}
      onClose={onClose}
      fullScreen={fullScreen}
      fullWidth
      maxWidth={sideBySide ? 'lg' : 'sm'}
      aria-labelledby={titleId}
      sx={{
        '& .MuiDialog-paper': fullScreen
          ? { borderRadius: 0 }
          : sideBySide
            ? { height: 'calc(100% - 4rem)' }
            : {},
      }}
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

          <DialogContent
            sx={
              sideBySide
                ? {
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
                    gap: 3,
                    overflow: 'hidden',
                    pb: 1,
                  }
                : undefined
            }
          >
            {hasSources && !sideBySide && (
              <Button
                startIcon={<ImageOutlinedIcon />}
                aria-expanded={showSheet}
                onClick={() => setShowSheet((shown) => !shown)}
                sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem', mt: 1, mb: 2 }]}
              >
                {showSheet ? 'Hide sheet' : 'Show sheet'}
              </Button>
            )}
            {hasSources && (sideBySide || showSheet) && (
              <BidSheetSourceViewer
                sources={sources}
                index={sourceIndex}
                onIndexChange={setSourceIndex}
                page={row.sourcePage}
                memory={viewerMemory}
                sx={sideBySide ? { pt: 1 } : { height: '60dvh', mb: 3 }}
              />
            )}
            {/* Room around the fields so their wells' shadows aren't clipped. */}
            <Box
              sx={
                sideBySide
                  ? { overflowY: 'auto', minHeight: 0, px: 1, pt: 1, pb: 2 }
                  : { pt: 1 }
              }
            >
              <CoverBidJobFields
                key={row.key}
                row={row}
                onChange={(field, value) => onFieldChange(row.key, field, value)}
                duplicate={isDuplicateJobNumber(row, duplicates)}
              />
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
