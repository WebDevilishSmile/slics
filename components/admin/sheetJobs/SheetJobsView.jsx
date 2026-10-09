'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  ButtonBase,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';

import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import {
  softInputSx,
  softPressSx,
  softRaised,
  softTableSx,
} from '@/components/utility/soft';
import JobChangesFeed from './JobChangesFeed';
import SheetJobDialog from './SheetJobDialog';

// "15:00" or "0:09" → minutes, for sorting start times; NaN when not a time.
const minutes = (value) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
  return match ? Number(match[1]) * 60 + Number(match[2]) : NaN;
};

// The table's columns: what each heading sorts by. Numbers and times sort as
// numbers, the rest as text; blank cells go last either way.
const COLUMNS = [
  { key: 'jobName', label: 'Job', value: (job) => job.jobName, type: 'text' },
  { key: 'driver', label: 'Driver', value: (job) => job.driver, type: 'text' },
  ...DAY_FIELDS.map((day) => ({
    key: day,
    label: DAY_LABELS[day],
    value: (job) => minutes(job.days[day].start),
    type: 'number',
  })),
  { key: 'weekHours', label: 'Week hrs', value: (job) => parseFloat(job.weekHours), type: 'number' },
  { key: 'seniority', label: 'Seniority', value: (job) => parseFloat(job.seniority), type: 'number' },
];

function sortJobs(jobs, { key, direction }) {
  const column = COLUMNS.find((c) => c.key === key);
  if (!column) return jobs;
  const sign = direction === 'asc' ? 1 : -1;
  const blank = (v) => (column.type === 'number' ? Number.isNaN(v) : !v);
  return [...jobs].sort((a, b) => {
    const x = column.value(a);
    const y = column.value(b);
    if (blank(x) || blank(y)) return blank(x) - blank(y);
    const order =
      column.type === 'number' ? x - y : x.localeCompare(y, undefined, { numeric: true, sensitivity: 'base' });
    return sign * order;
  });
}

// One job on a phone: job, driver, the week's start times and the numbers.
function JobCard({ job, onOpen }) {
  return (
    <ButtonBase
      onClick={() => onOpen(job.jobName)}
      sx={[
        softRaised,
        softPressSx,
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 1,
          width: 1,
          p: 2,
          borderRadius: 4,
          textAlign: 'left',
        },
      ]}
    >
      <Box component='span' sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
        <Typography component='span' variant='h6' sx={{ fontWeight: 700 }}>
          {job.jobName}
        </Typography>
        <Typography component='span' variant='body2' color='text.secondary'>
          {job.seniority && `Seniority ${job.seniority}`}
        </Typography>
      </Box>
      <Typography component='span' variant='body2'>
        {job.driver || 'No driver'}
        {job.weekHours && (
          <Box component='span' sx={{ color: 'text.secondary' }}>
            {' '}· {job.weekHours} h/week
          </Box>
        )}
      </Typography>
      <Box
        component='span'
        sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 0.5, textAlign: 'center' }}
      >
        {DAY_FIELDS.map((day) => (
          <Box component='span' key={day}>
            <Typography component='span' variant='caption' sx={{ display: 'block', color: 'text.secondary' }}>
              {DAY_LABELS[day]}
            </Typography>
            <Typography
              component='span'
              variant='caption'
              sx={{ display: 'block', fontWeight: job.days[day].start ? 600 : 400, fontVariantNumeric: 'tabular-nums' }}
            >
              {job.days[day].start || '–'}
            </Typography>
          </Box>
        ))}
      </Box>
    </ButtonBase>
  );
}

// The saved Jobs tab: a searchable list of jobs (a table when wide, cards on a
// phone), each opening its details and history, and the Changes feed.
export default function SheetJobsView({ jobs, changes, moreChanges }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const [search, setSearch] = useState('');
  const [openJob, setOpenJob] = useState(null);
  // null keeps the sheet's own order; a heading sorts by its column, a second
  // tap reverses it.
  const [sort, setSort] = useState(null);

  const byName = useMemo(() => new Map(jobs.map((job) => [job.jobName, job])), [jobs]);
  const sorted = useMemo(() => (sort ? sortJobs(jobs, sort) : jobs), [jobs, sort]);
  const query = search.trim().toLowerCase();
  const shown = query
    ? sorted.filter(
        (job) =>
          job.jobName.toLowerCase().includes(query) ||
          job.driver.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      )
    : sorted;

  const sortBy = (key) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <JobChangesFeed initial={changes} initialMore={moreChanges} onOpenJob={setOpenJob} />

      <Box component='section' aria-labelledby='sheet-jobs-heading'>
        <Typography id='sheet-jobs-heading' variant='h6' component='h3'>
          All jobs ({jobs.length})
        </Typography>
        <TextField
          placeholder='Search job, driver or route'
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
          sx={[softInputSx, { mt: 1.5 }]}
          slotProps={{ htmlInput: { 'aria-label': 'Search job, driver or route' } }}
        />

        {shown.length === 0 ? (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 2 }}>
            {jobs.length === 0 ? 'No jobs saved yet. Refresh from the sheet to pull them.' : 'No jobs match your search.'}
          </Typography>
        ) : wide ? (
          <TableContainer sx={{ mt: 2 }}>
            <Table size='small' sx={softTableSx}>
              <TableHead>
                <TableRow>
                  {COLUMNS.map((column) => {
                    const active = sort?.key === column.key;
                    return (
                      <TableCell
                        key={column.key}
                        sortDirection={active ? sort.direction : false}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        <TableSortLabel
                          active={active}
                          direction={active ? sort.direction : 'asc'}
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
                  <TableRow
                    key={job.jobName}
                    hover
                    onClick={() => setOpenJob(job.jobName)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell sx={{ fontWeight: 600 }}>
                      {/* The row opens on click; this button is the keyboard way in. */}
                      <ButtonBase
                        onClick={(event) => {
                          event.stopPropagation();
                          setOpenJob(job.jobName);
                        }}
                        sx={{ font: 'inherit', borderRadius: 1, px: 0.5 }}
                      >
                        {job.jobName}
                      </ButtonBase>
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{job.driver || '—'}</TableCell>
                    {DAY_FIELDS.map((day) => (
                      <TableCell key={day} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                        {job.days[day].start}
                      </TableCell>
                    ))}
                    <TableCell>{job.weekHours}</TableCell>
                    <TableCell>{job.seniority}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {shown.map((job) => (
              <JobCard key={job.jobName} job={job} onOpen={setOpenJob} />
            ))}
          </Box>
        )}
      </Box>

      <SheetJobDialog jobName={openJob} job={byName.get(openJob)} onClose={() => setOpenJob(null)} />
    </Box>
  );
}
