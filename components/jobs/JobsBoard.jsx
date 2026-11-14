'use client';

import { useMemo, useState } from 'react';
import {
  Box,
  Button,
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
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import { sortRows, startMinutes } from '@/lib/jobTable';
import {
  softInputSx,
  softPressSx,
  softRaised,
  softTableSx,
  softToggleSx,
} from '@/components/utility/soft';
import JobDialog from './JobDialog';

// The table's columns: what each heading sorts by (sortRows, lib/jobTable.js).
const COLUMNS = [
  { key: 'jobName', label: 'Job', value: (job) => job.jobName, type: 'text' },
  ...DAY_FIELDS.map((day) => ({
    key: day,
    label: DAY_LABELS[day],
    value: (job) => startMinutes(job.days[day].start),
    type: 'number',
  })),
  { key: 'weekHours', label: 'Week hrs', value: (job) => parseFloat(job.weekHours), type: 'number' },
  { key: 'seniority', label: 'Seniority', value: (job) => parseFloat(job.seniority), type: 'number' },
];

// On a phone the jobs are cards with no headings to tap, so these sort them.
const CARD_SORTS = [
  { key: 'jobName', label: 'Job' },
  { key: 'seniority', label: 'Seniority' },
  { key: 'weekHours', label: 'Week hours' },
];

const yourJobSx = { color: 'primary.main', fontWeight: 700 };

// One job on a phone: its code, seniority number, week hours and the week's
// start times.
function JobCard({ job, onOpen }) {
  return (
    <ButtonBase
      onClick={() => onOpen(job)}
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
      <Box component='span' sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography component='span' variant='h6' sx={{ fontWeight: 700 }}>
          {job.jobName}
        </Typography>
        <Typography component='span' variant='body2' color='text.secondary'>
          {job.seniority && `Seniority #${job.seniority}`}
        </Typography>
      </Box>
      {(job.mine || job.weekHours) && (
        <Typography component='span' variant='body2'>
          {job.mine && (
            <Box component='span' sx={yourJobSx}>
              Your job
            </Box>
          )}
          {job.mine && job.weekHours && ' · '}
          {job.weekHours && (
            <Box component='span' sx={{ color: 'text.secondary' }}>
              {job.weekHours} h/week
            </Box>
          )}
        </Typography>
      )}
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

// The drivers' Jobs page (app/jobs/page.jsx, docs/JOBS-PAGE.md): every bid job
// on the on-call sheet's Jobs tab, a table when wide and cards on a phone,
// searchable and sortable, each opening its week and route (JobDialog).
// `jobs` come through toDriverSheetJob (lib/serializers.js): a job's code,
// times, route, week hours and the seniority number of the driver on it,
// never a name. `stops` is [stopKey, { numSlic, alpha }] pairs for the routes'
// stops that are SLICs (a Map can't cross from the server page).
export default function JobsBoard({ jobs, stops = [] }) {
  const theme = useTheme();
  const wide = useMediaQuery(theme.breakpoints.up('md'));
  const [search, setSearch] = useState('');
  const [openJob, setOpenJob] = useState(null);
  // null keeps the sheet's own order; a heading (or a chip on a phone) sorts
  // by its column, a second tap reverses it.
  const [sort, setSort] = useState(null);

  const slicsByStop = useMemo(() => new Map(stops), [stops]);
  const sorted = useMemo(() => (sort ? sortRows(jobs, COLUMNS, sort) : jobs), [jobs, sort]);
  const query = search.trim().toLowerCase();
  const shown = query
    ? sorted.filter(
        (job) => job.jobName.toLowerCase().includes(query) || job.description.toLowerCase().includes(query),
      )
    : sorted;

  const sortBy = (key) =>
    setSort((current) =>
      current?.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant='body2' color='text.secondary'>
        Every bid job on the on-call sheet, with its start times and route. Seniority is the
        number of the driver who holds the job. Names aren&apos;t shown.
      </Typography>

      <TextField
        placeholder='Search job or route'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        fullWidth
        sx={softInputSx}
        slotProps={{ htmlInput: { 'aria-label': 'Search job or route' } }}
      />

      {!wide && jobs.length > 0 && (
        <Box role='group' aria-label='Sort jobs' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
          <Button
            aria-pressed={!sort}
            onClick={() => setSort(null)}
            sx={[softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
          >
            Sheet order
          </Button>
          {CARD_SORTS.map((entry) => {
            const active = sort?.key === entry.key;
            const Arrow = active && sort.direction === 'desc' ? ArrowDownward : ArrowUpward;
            return (
              <Button
                key={entry.key}
                aria-pressed={active}
                aria-label={
                  active
                    ? `${entry.label}, ${sort.direction === 'asc' ? 'lowest first' : 'highest first'}`
                    : entry.label
                }
                onClick={() => sortBy(entry.key)}
                endIcon={active ? <Arrow fontSize='small' /> : null}
                sx={[softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
              >
                {entry.label}
              </Button>
            );
          })}
        </Box>
      )}

      <Typography variant='caption' color='text.secondary' role='status'>
        {query ? `${shown.length} of ${jobs.length} jobs` : `${jobs.length} job${jobs.length === 1 ? '' : 's'}`}
      </Typography>

      {shown.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          {jobs.length === 0 ? 'No jobs to show yet.' : 'No jobs match your search.'}
        </Typography>
      ) : wide ? (
        <TableContainer>
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
                <TableRow key={job.jobName} hover onClick={() => setOpenJob(job)} sx={{ cursor: 'pointer' }}>
                  <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {/* The row opens on click; this button is the keyboard way in. */}
                    <ButtonBase
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenJob(job);
                      }}
                      sx={{ font: 'inherit', borderRadius: 1, px: 0.5 }}
                    >
                      {job.jobName}
                    </ButtonBase>
                    {job.mine && (
                      <Typography component='span' variant='caption' sx={[yourJobSx, { ml: 1 }]}>
                        Your job
                      </Typography>
                    )}
                  </TableCell>
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {shown.map((job) => (
            <JobCard key={job.jobName} job={job} onOpen={setOpenJob} />
          ))}
        </Box>
      )}

      <JobDialog job={openJob} slicsByStop={slicsByStop} onClose={() => setOpenJob(null)} />
    </Box>
  );
}
