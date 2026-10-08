'use client';

import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import CoverBidJobEditCard from './CoverBidJobEditCard';
import CoverBidJobRowActions from './CoverBidJobRowActions';
import CoverBidJobsEditTable from './CoverBidJobsEditTable';
import DeleteCoverBidJobsDialog from './DeleteCoverBidJobsDialog';
import { useCoverBidJobs } from '@/hooks/useCoverBidJobs';
import { isUnsaved } from '@/lib/coverBidJobRow';
import { softContainedSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';

export default function CoverBidJobsManager({ weekEndDate, refreshKey }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

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

  const requestDeleteRow = (row) => {
    // An unsaved draft isn't worth a confirmation — nothing has been persisted.
    if (isUnsaved(row)) {
      deleteRow(row);
      return;
    }
    setDeleteRequest({ type: 'row', row });
  };

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

      {isDesktop ? (
        <CoverBidJobsEditTable
          rows={rows}
          onFieldChange={updateField}
          onSaveRow={saveRow}
          onDeleteRow={requestDeleteRow}
          savingKey={savingKey}
          deletingKey={deletingKey}
        />
      ) : (
        <Stack spacing={1.5}>
          {rows.map((row) => (
            <CoverBidJobEditCard
              key={row.key}
              row={row}
              onChange={(field, value) => updateField(row.key, field, value)}
              actions={
                <CoverBidJobRowActions
                  row={row}
                  onSave={saveRow}
                  onDelete={requestDeleteRow}
                  saving={savingKey === row.key}
                  deleting={deletingKey === row.key}
                />
              }
            />
          ))}
        </Stack>
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
          onClick={addRow}
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

      <DeleteCoverBidJobsDialog
        request={deleteRequest}
        onCancel={() => setDeleteRequest(null)}
        onConfirm={handleConfirmDelete}
        deleting={deleteInFlight}
      />
    </Box>
  );
}
