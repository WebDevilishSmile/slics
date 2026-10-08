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
import CoverBidJobReviewDialog from './CoverBidJobReviewDialog';
import CoverBidJobRowActions from './CoverBidJobRowActions';
import CoverBidJobSummaryCard from './CoverBidJobSummaryCard';
import CoverBidJobsTable from './CoverBidJobsTable';
import DeleteCoverBidJobsDialog from './DeleteCoverBidJobsDialog';
import { useCoverBidJobs } from '@/hooks/useCoverBidJobs';
import {
  findDuplicateJobNumbers,
  isDirty,
  isDuplicateJobNumber,
  isUnsaved,
} from '@/lib/coverBidJobRow';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

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

export default function CoverBidJobsManager({ weekEndDate, refreshKey }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('lg'));

  const {
    rows,
    loading,
    error,
    savingKey,
    deletingKey,
    deletingAll,
    updateField,
    addRow,
    saveRow,
    deleteRow,
    deleteAll,
  } = useCoverBidJobs({ weekEndDate, refreshKey });

  // null when closed; otherwise the pending destructive action.
  const [deleteRequest, setDeleteRequest] = useState(null);
  // The job open in the review dialog, or null.
  const [reviewIndex, setReviewIndex] = useState(null);
  if (rows.length === 0 && reviewIndex !== null) setReviewIndex(null);

  const duplicates = useMemo(() => findDuplicateJobNumbers(rows), [rows]);

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
        saving={savingKey === row.key}
        deleting={deletingKey === row.key}
      />
    ),
    [saveRow, requestDeleteRow, savingKey, deletingKey]
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

      {wide ? (
        <CoverBidJobsTable
          rows={rows}
          duplicates={duplicates}
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
        status={(row) => <UnsavedStatus row={row} />}
        onDelete={requestDeleteRow}
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
