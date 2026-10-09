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

  const byName = useMemo(() => new Map(jobs.map((job) => [job.jobName, job])), [jobs]);
  const query = search.trim().toLowerCase();
  const shown = query
    ? jobs.filter(
        (job) =>
          job.jobName.toLowerCase().includes(query) ||
          job.driver.toLowerCase().includes(query) ||
          job.description.toLowerCase().includes(query)
      )
    : jobs;

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
                  <TableCell>Job</TableCell>
                  <TableCell>Driver</TableCell>
                  {DAY_FIELDS.map((day) => (
                    <TableCell key={day}>{DAY_LABELS[day]}</TableCell>
                  ))}
                  <TableCell>Week hrs</TableCell>
                  <TableCell>Seniority</TableCell>
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
