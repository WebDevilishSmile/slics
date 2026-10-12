'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import CoverBidJobReviewDialog, { squareButtonSx } from './CoverBidJobReviewDialog';
import CoverBidJobRowActions from './CoverBidJobRowActions';
import HideJobButton from './HideJobButton';
import CoverBidJobSummaryCard from './CoverBidJobSummaryCard';
import CoverBidJobsTable from './CoverBidJobsTable';
import DeleteCoverBidJobsDialog from './DeleteCoverBidJobsDialog';
import PickedByList, { pickedByJob } from './PickedByList';
import { useCoverBidJobs } from '@/hooks/useCoverBidJobs';
import {
  findDuplicateJobNumbers,
  isDirty,
  isDuplicateJobNumber,
  isUnsaved,
  jobKey,
} from '@/lib/coverBidJobRow';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { HiddenLabel } from '@/components/coverBidJobs/jobGrid';

// Nothing for a row that matches what's saved.
function UnsavedStatus({ row }) {
  if (!isDirty(row)) return null;
  return (
    <Box
      component='span'
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        typography: 'body2',
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <EditNoteIcon fontSize='small' sx={{ color: 'warning.main' }} />
      {isUnsaved(row) ? 'New, not saved' : 'Unsaved changes'}
    </Box>
  );
}

// `picks` is the week's saved picks from the on-call sheet, or null; with them,
// the job dialog lists who picked each job.
export default function CoverBidJobsManager({ weekEndDate, refreshKey, picks = null }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));

  const {
    rows,
    loading,
    error,
    savingKey,
    deletingKey,
    deletingAll,
    hidingKey,
    updateField,
    addRow,
    saveRow,
    deleteRow,
    deleteAll,
    isRowHidden,
    toggleHidden,
  } = useCoverBidJobs({ weekEndDate, refreshKey });

  // null when closed; otherwise the pending destructive action.
  const [deleteRequest, setDeleteRequest] = useState(null);
  // The job open in the review dialog, or null.
  const [reviewIndex, setReviewIndex] = useState(null);
  if (rows.length === 0 && reviewIndex !== null) setReviewIndex(null);

  const duplicates = useMemo(() => findDuplicateJobNumbers(rows), [rows]);
  const pickedBy = useMemo(() => pickedByJob(picks), [picks]);
  const hiddenCount = useMemo(() => rows.filter(isRowHidden).length, [rows, isRowHidden]);

  const requestDeleteRow = useCallback(
    (row) => {
      // An unsaved draft isn't worth a confirmation — nothing has been persisted.
      if (isUnsaved(row)) {
        deleteRow(row);
        return;
      }
      setDeleteRequest({ type: 'row', row });
    },
    [deleteRow]
  );

  const requestDeleteAll = () => {
    if (rows.length === 0 || !weekEndDate) return;
    setDeleteRequest({
      type: 'all',
      count: rows.length,
      weekLabel: weekEndDate.format('MM/DD/YYYY'),
    });
  };

  const handleConfirmDelete = async () => {
    try {
      if (deleteRequest.type === 'all') {
        await deleteAll();
      } else {
        await deleteRow(deleteRequest.row);
      }
      setDeleteRequest(null);
    } catch {
      // The hook has already set `error`; keep the dialog open so the admin can
      // retry or cancel.
    }
  };

  const handleAddRow = () => {
    addRow();
    // Cards have nothing to type into, so open the new job in the review.
    if (!wide) setReviewIndex(rows.length);
  };

  const renderLeading = useCallback(
    (row, index) => (
      <Tooltip title='Review'>
        <IconButton
          aria-label={`Review ${row.jobNumber ? `job ${row.jobNumber}` : `row ${index + 1}`}`}
          onClick={() => setReviewIndex(index)}
          sx={softPressSx}
        >
          <OpenInFullIcon fontSize='small' />
        </IconButton>
      </Tooltip>
    ),
    []
  );

  const renderActions = useCallback(
    (row) => (
      <CoverBidJobRowActions
        row={row}
        onSave={saveRow}
        onDelete={requestDeleteRow}
        onToggleHidden={toggleHidden}
        saving={savingKey === row.key}
        deleting={deletingKey === row.key}
        hidden={isRowHidden(row)}
        hiding={hidingKey === row.key}
      />
    ),
    [saveRow, requestDeleteRow, toggleHidden, isRowHidden, savingKey, deletingKey, hidingKey]
  );

  const deleteInFlight =
    deleteRequest?.type === 'all'
      ? deletingAll
      : deletingKey === deleteRequest?.row?.key;

  // Row-shaped skeletons while the week's jobs load (UI-SUGGESTIONS.md #43).
  if (loading) {
    return (
      <Stack spacing={1.5} sx={{ marginTop: 3 }} aria-busy='true' aria-label='Loading jobs'>
        {[0, 1, 2, 3].map((row) => (
          <Skeleton key={row} variant='rounded' height='3rem' />
        ))}
      </Stack>
    );
  }

  return (
    <Box sx={{ marginTop: 3 }}>
      {error && (
        <Alert severity='error' sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      {/* Also the polite announcement when a job is hidden or shown. */}
      {rows.length > 0 && (
        <Typography variant='body2' color='text.secondary' aria-live='polite' sx={{ mb: 2 }}>
          {rows.length} job{rows.length !== 1 ? 's' : ''}
          {hiddenCount > 0 && ` · ${hiddenCount} hidden from drivers`}
        </Typography>
      )}

      {wide ? (
        <CoverBidJobsTable
          rows={rows}
          duplicates={duplicates}
          isHidden={isRowHidden}
          onFieldChange={updateField}
          renderLeading={renderLeading}
          renderActions={renderActions}
          leadingLabel='Review'
        />
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {rows.map((row, index) => (
            <CoverBidJobSummaryCard
              key={row.key}
              row={row}
              index={index}
              duplicate={isDuplicateJobNumber(row, duplicates)}
              hidden={isRowHidden(row)}
              status={<UnsavedStatus row={row} />}
              onOpen={setReviewIndex}
            />
          ))}
        </Box>
      )}

      {rows.length === 0 && (
        <Typography variant='body2' color='text.secondary' sx={{ marginTop: 1 }}>
          No jobs saved for this week yet.
        </Typography>
      )}

      <Box
        sx={{
          marginTop: 2,
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
        }}
      >
        <Button
          onClick={handleAddRow}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
        >
          Add Row
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={requestDeleteAll}
          disabled={rows.length === 0 || deletingAll}
          sx={softContainedSx}
        >
          {deletingAll ? 'Deleting…' : 'Delete All'}
        </Button>
      </Box>

      <CoverBidJobReviewDialog
        rows={rows}
        index={reviewIndex}
        onIndexChange={setReviewIndex}
        onClose={() => setReviewIndex(null)}
        onFieldChange={updateField}
        duplicates={duplicates}
        status={(row) => (
          <Box
            component='span'
            sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', columnGap: 2 }}
          >
            {isRowHidden(row) && <HiddenLabel sx={{ typography: 'body2', fontWeight: 600 }} />}
            <UnsavedStatus row={row} />
          </Box>
        )}
        onDelete={requestDeleteRow}
        renderSecondary={(row) => (
          <HideJobButton
            row={row}
            hidden={isRowHidden(row)}
            onToggle={toggleHidden}
            busy={hidingKey === row.key}
            disabled={savingKey === row.key || deletingKey === row.key}
            sx={squareButtonSx}
          />
        )}
        footer={
          picks
            ? (row) => <PickedByList entries={pickedBy.get(jobKey(row.jobNumber)) ?? []} />
            : undefined
        }
        renderPrimary={(row) => {
          const saving = savingKey === row.key;
          const dirty = isDirty(row);
          return (
            <Button
              variant='contained'
              onClick={() => saveRow(row)}
              disabled={!dirty || saving || deletingKey === row.key}
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            >
              {saving ? 'Saving…' : dirty ? 'Save job' : 'Saved'}
            </Button>
          );
        }}
      />

      <DeleteCoverBidJobsDialog
        request={deleteRequest}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleteInFlight}
      />
    </Box>
  );
}
