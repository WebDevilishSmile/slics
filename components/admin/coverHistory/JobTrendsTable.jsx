'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';

import { shortDate } from '@/components/admin/hub/format';
import { softInputSx, softPressSx, softRaisedSmall, softTableSx, softToggleSx } from '@/components/utility/soft';
import { JOB_FILTERS } from '@/lib/coverHistory';

const FILTERS = [
  { key: 'recurring', label: 'Recurring' },
  { key: 'takenEarly', label: 'Taken early' },
  { key: 'onCall', label: 'Left for on call' },
  { key: 'neverTaken', label: 'Never taken' },
  { key: 'onLists', label: 'On lists' },
];

// `value` sorts; a null sorts last whichever way.
const COLUMNS = [
  { key: 'jobNumber', label: 'Job', value: (job) => job.jobNumber, text: true },
  { key: 'weeks', label: 'Weeks', value: (job) => job.weeks },
  { key: 'taken', label: 'Taken', value: (job) => (job.knownWeeks ? job.taken / job.knownWeeks : null) },
  { key: 'avgPlace', label: 'Avg place', value: (job) => job.avgPlace },
  { key: 'bestPlace', label: 'Best', value: (job) => job.bestPlace },
  { key: 'onCallTakes', label: 'By on call', value: (job) => job.onCallTakes },
  { key: 'lists', label: 'On lists', value: (job) => job.lists },
  { key: 'lastWeek', label: 'Last seen', value: (job) => job.lastWeek, text: true },
];
const PAGE = 25;

function compare(column, direction) {
  return (a, b) => {
    const x = column.value(a);
    const y = column.value(b);
    if (x === null && y === null) return 0;
    if (x === null) return 1;
    if (y === null) return -1;
    const order = column.text ? String(x).localeCompare(String(y)) : x - y;
    return direction === 'asc' ? order : -order;
  };
}

// Every cover job number across the weeks (jobTrends, lib/coverHistory.js):
// how often it's posted and taken, the place on the pick list that took it
// (a small number is a wanted job), and how many lists it was on. `filter`
// comes from a finding that pointed here.
export default function JobTrendsTable({ jobs, filter, setFilter }) {
  const [sort, setSort] = useState({ key: 'weeks', direction: 'desc' });
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);

  const rows = useMemo(() => {
    const query = search.trim().toUpperCase();
    const column = COLUMNS.find((entry) => entry.key === sort.key);
    return jobs
      .filter((job) => !filter || JOB_FILTERS[filter](job))
      .filter((job) => !query || job.jobKey.includes(query))
      .sort(compare(column, sort.direction));
  }, [jobs, filter, search, sort]);
  const shown = showAll ? rows : rows.slice(0, PAGE);

  const sortBy = (key) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box role='group' aria-label='Show jobs' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {FILTERS.map((entry) => (
          <Button
            key={entry.key}
            aria-pressed={filter === entry.key}
            onClick={() => setFilter(filter === entry.key ? null : entry.key)}
            sx={[softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
          >
            {entry.label} ({jobs.filter(JOB_FILTERS[entry.key]).length})
          </Button>
        ))}
      </Box>
      <TextField
        placeholder='Find a job number'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={[softInputSx, { maxWidth: (theme) => theme.layout.width.field }]}
        slotProps={{ htmlInput: { 'aria-label': 'Find a job number' } }}
      />

      {rows.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No jobs match.
        </Typography>
      ) : (
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table size='small' sx={softTableSx} aria-label='Cover jobs across the weeks'>
            <TableHead>
              <TableRow>
                {COLUMNS.map((column) => {
                  const active = sort.key === column.key;
                  return (
                    <TableCell
                      key={column.key}
                      align={column.text ? 'left' : 'right'}
                      sortDirection={active ? sort.direction : false}
                      sx={{ whiteSpace: 'nowrap' }}
                    >
                      <TableSortLabel
                        active={active}
                        direction={active ? sort.direction : 'desc'}
                        onClick={() => sortBy(column.key)}
                      >
                        {column.label}
                      </TableSortLabel>
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map((job) => (
                <TableRow key={job.jobKey}>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{job.jobNumber}</TableCell>
                  <TableCell align='right'>{job.weeks}</TableCell>
                  <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                    {job.knownWeeks ? `${job.taken} of ${job.knownWeeks}` : '—'}
                  </TableCell>
                  <TableCell align='right'>{job.avgPlace ?? '—'}</TableCell>
                  <TableCell align='right'>{job.bestPlace ?? '—'}</TableCell>
                  <TableCell align='right'>{job.timesPlaced ? job.onCallTakes : '—'}</TableCell>
                  <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                    {job.lists ? `${job.lists} (first ${job.first})` : '—'}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{shortDate(job.lastWeek)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      {rows.length > PAGE && (
        <Button
          onClick={() => setShowAll((value) => !value)}
          sx={[softRaisedSmall, softPressSx, { alignSelf: 'center', minHeight: '2.75rem', px: 3 }]}
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length}`}
        </Button>
      )}
      <Typography variant='body2' color='text.secondary'>
        Place is where the driver who took the job was on the week&apos;s pick list: 1–20 are cover
        drivers, after that on call. Taken counts weeks the job was shown to drivers and its outcome is
        known.
      </Typography>
    </Box>
  );
}
