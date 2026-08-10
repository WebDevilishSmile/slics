'use client';

import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import {
  CoverBidJobRowFields,
  CoverBidJobRowHeadCells,
} from './CoverBidJobRowCells';
import CoverBidJobEditCard from './CoverBidJobEditCard';

const FIELDS = [
  'jobNumber',
  'name',
  'assignedDriver',
  'coverReason',
  'sun',
  'mon',
  'tue',
  'wed',
  'thu',
  'fri',
  'sat',
  'description',
];

function toRowState(job) {
  const values = Object.fromEntries(
    FIELDS.map((field) => [field, job[field] ?? ''])
  );
  return { key: job._id, _id: job._id, ...values, saved: values };
}

function emptyRowState() {
  const values = Object.fromEntries(FIELDS.map((field) => [field, '']));
  return {
    key: crypto.randomUUID(),
    _id: null,
    ...values,
    saved: null,
  };
}

function isDirty(row) {
  if (!row.saved) return true;
  return FIELDS.some((field) => row[field] !== row.saved[field]);
}

export default function CoverBidJobsManager({ weekEndDate, refreshKey }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savingKey, setSavingKey] = useState(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    if (!weekEndDate) return;

    let cancelled = false;

    async function fetchJobs() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/coverBidJobs?weekEnding=${weekEndDate.format('YYYY-MM-DD')}`
        );
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load cover bid jobs');
        }
        if (!cancelled) setRows(data.data.map(toRowState));
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchJobs();

    return () => {
      cancelled = true;
    };
  }, [weekEndDate, refreshKey]);

  const handleFieldChange = (key, field, value) => {
    setRows((prev) =>
      prev.map((row) => (row.key === key ? { ...row, [field]: value } : row))
    );
  };

  const handleAddRow = () => {
    setRows((prev) => [...prev, emptyRowState()]);
  };

  const handleSaveRow = async (row) => {
    setSavingKey(row.key);
    setError(null);

    const values = Object.fromEntries(FIELDS.map((field) => [field, row[field]]));

    try {
      if (row._id) {
        const res = await fetch(`/api/coverBidJob/${row._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to update job');
        }
        setRows((prev) =>
          prev.map((r) => (r.key === row.key ? { ...r, saved: values } : r))
        );
      } else {
        const res = await fetch('/api/coverBidJobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekEnding: weekEndDate.format('YYYY-MM-DD'),
            rows: [values],
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to add job');
        }
        const saved = data.data[0];
        setRows((prev) =>
          prev.map((r) =>
            r.key === row.key
              ? { key: saved._id, _id: saved._id, ...values, saved: values }
              : r
          )
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKey(null);
    }
  };

  const handleDeleteRow = async (row) => {
    if (!row._id) {
      setRows((prev) => prev.filter((r) => r.key !== row.key));
      return;
    }

    if (!window.confirm(`Delete job ${row.jobNumber || '(no job #)'}?`)) {
      return;
    }

    setError(null);

    try {
      const res = await fetch(`/api/coverBidJob/${row._id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete job');
      }
      setRows((prev) => prev.filter((r) => r.key !== row.key));
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDeleteAll = async () => {
    if (rows.length === 0 || !weekEndDate) return;

    const weekLabel = weekEndDate.format('MM/DD/YYYY');
    if (
      !window.confirm(
        `Delete all ${rows.length} job${
          rows.length === 1 ? '' : 's'
        } for week ending ${weekLabel}? This cannot be undone.`
      )
    ) {
      return;
    }

    setError(null);
    setDeletingAll(true);

    try {
      const res = await fetch(
        `/api/coverBidJobs?weekEnding=${weekEndDate.format('YYYY-MM-DD')}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete jobs');
      }
      setRows([]);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeletingAll(false);
    }
  };

  return (
    <Box sx={{ marginTop: 3 }}>
      {error && (
        <Alert severity='error' sx={{ marginBottom: 2 }}>
          {error}
        </Alert>
      )}

      {loading && (
        <Typography variant='body2' color='text.secondary'>
          Loading...
        </Typography>
      )}

      {!loading && (
        <>
          {isDesktop ? (
            <TableContainer component={Paper}>
              <Table size='small'>
                <TableHead>
                  <TableRow>
                    <CoverBidJobRowHeadCells />
                    <TableCell />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.key}>
                      <CoverBidJobRowFields
                        row={row}
                        onChange={(field, value) =>
                          handleFieldChange(row.key, field, value)
                        }
                      />
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>
                        <IconButton
                          size='small'
                          onClick={() => handleSaveRow(row)}
                          disabled={!isDirty(row) || savingKey === row.key}
                          aria-label='Save row'
                        >
                          <SaveIcon fontSize='small' />
                        </IconButton>
                        <IconButton
                          size='small'
                          onClick={() => handleDeleteRow(row)}
                          aria-label='Delete row'
                        >
                          <DeleteIcon fontSize='small' />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Stack spacing={1.5}>
              {rows.map((row) => (
                <CoverBidJobEditCard
                  key={row.key}
                  row={row}
                  onChange={(field, value) =>
                    handleFieldChange(row.key, field, value)
                  }
                  actions={
                    <>
                      <IconButton
                        size='small'
                        onClick={() => handleSaveRow(row)}
                        disabled={!isDirty(row) || savingKey === row.key}
                        aria-label='Save row'
                      >
                        <SaveIcon fontSize='small' />
                      </IconButton>
                      <IconButton
                        size='small'
                        onClick={() => handleDeleteRow(row)}
                        aria-label='Delete row'
                      >
                        <DeleteIcon fontSize='small' />
                      </IconButton>
                    </>
                  }
                />
              ))}
            </Stack>
          )}

          {rows.length === 0 && (
            <Typography
              variant='body2'
              color='text.secondary'
              sx={{ marginTop: 1 }}
            >
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
            <Button variant='text' onClick={handleAddRow}>
              Add Row
            </Button>
            <Button
              variant='outlined'
              color='error'
              onClick={handleDeleteAll}
              disabled={rows.length === 0 || deletingAll}
            >
              {deletingAll ? 'Deleting...' : 'Delete All'}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
}
