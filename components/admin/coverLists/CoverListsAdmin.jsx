'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Paper,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import CoverCalendar from '@/components/covers/Calendar';
import { softInset, softRaised, softTableSx } from '@/components/utility/soft';
import { useCoverLists } from '@/hooks/useCoverLists';
import { getUpcomingSaturday } from '@/lib/format';
import theme from '@/theme';
import { displayName } from '@/lib/names';

// "Cover 3 · 7:30", "On call #2 · 8:00", or why there's no place.
function spotLabel(spot) {
  if (!spot) return "Not on this week's pick list";
  const place =
    spot.kind === 'onCall'
      ? spot.order
        ? `On call #${spot.order}`
        : 'On call'
      : spot.status === 'out'
        ? `Cover ${spot.position} · out`
        : spot.position
          ? `Cover ${spot.position}`
          : 'Cover';
  return spot.callIn ? `${place} · ${spot.callIn}` : place;
}

const STATUS_LABEL = { picked: 'Taken', gone: 'No longer posted' };

// One driver's list: their open choices numbered in order, then the jobs on
// it that were taken or are gone, struck through and labeled.
function DriverList({ list }) {
  const open = list.entries.filter((entry) => entry.status === 'open');
  const closed = list.entries.filter((entry) => entry.status !== 'open');

  return (
    <Box component='li' sx={[softRaised, { borderRadius: 4, p: 2.5, listStyle: 'none' }]}>
      <Typography sx={{ fontWeight: 700 }}>{displayName(list.driverName) || list.name || 'Unknown driver'}</Typography>
      <Typography variant='body2' color='text.secondary'>
        {spotLabel(list.spot)}
        {list.name && list.driverName ? ` · ${list.name}` : ''}
      </Typography>
      {list.updatedAt && (
        <Typography variant='caption' color='text.secondary' component='p'>
          Updated {dayjs(list.updatedAt).format('M/D h:mm A')}
        </Typography>
      )}

      <Box sx={[softInset, { mt: 1.5, borderRadius: 3, px: 2, py: 1.25 }]}>
        {open.length === 0 && (
          <Typography variant='body2' color='text.secondary'>
            No open jobs left on this list.
          </Typography>
        )}
        {open.length > 0 && (
          <Box component='ol' sx={{ m: 0, pl: 3 }}>
            {open.map((entry) => (
              <Typography component='li' key={entry.jobKey} sx={{ fontWeight: 600, py: 0.25 }}>
                {entry.jobNumber}
              </Typography>
            ))}
          </Box>
        )}
        {closed.length > 0 && (
          <Box component='ul' sx={{ m: 0, mt: open.length ? 1 : 0, pl: 3 }}>
            {closed.map((entry) => (
              <Typography component='li' variant='body2' key={entry.jobKey} color='text.secondary'>
                <Box component='span' sx={{ textDecoration: 'line-through' }}>
                  {entry.jobNumber}
                </Box>{' '}
                · {STATUS_LABEL[entry.status]}
              </Typography>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// Admins: every verified driver's cover list for a week, in pick order, and
// which jobs are most wanted (docs/COVER-BIDDING.md, stage 2). Drivers only
// see their own list on /covers; nobody else's ever reaches them.
export default function CoverListsAdmin() {
  // Next week, the week being bid on, as on the other cover pages.
  const [selectedDay, setSelectedDay] = useState(() => dayjs().add(1, 'week'));
  const weekEndDate = useMemo(() => getUpcomingSaturday(selectedDay), [selectedDay]);
  const { lists, demand, loading, error } = useCoverLists({ weekEndDate, refreshKey: 0 });

  return (
    <Paper
      variant='panel'
      sx={{
        maxWidth: theme.layout.width.wide,
        minHeight: 0,
        alignItems: 'stretch',
        my: 2,
        px: { xs: 1, sm: 3 },
      }}
    >
      <CoverCalendar value={selectedDay} setValue={setSelectedDay} />

      <Typography variant='h6' component='h2' sx={{ mt: 4 }}>
        W/E {weekEndDate.format('M/D/YYYY')}
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Stack spacing={2} sx={{ mt: 2 }} aria-busy='true' aria-label="Loading the drivers' lists">
          {[0, 1, 2].map((row) => (
            <Skeleton key={row} variant='rounded' height={120} sx={{ borderRadius: 4 }} />
          ))}
        </Stack>
      ) : (
        !error && (
          <>
            <Box component='section' aria-labelledby='most-wanted' sx={{ mt: 3 }}>
              <Typography id='most-wanted' variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
                Most wanted
              </Typography>
              {demand.length === 0 ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  No open job is on anyone&apos;s list for this week.
                </Typography>
              ) : (
                <Box sx={{ overflowX: 'auto', mt: 1 }}>
                  <Table size='small' sx={softTableSx} aria-labelledby='most-wanted'>
                    <TableHead>
                      <TableRow>
                        <TableCell>Job #</TableCell>
                        <TableCell>First choice for</TableCell>
                        <TableCell>On lists</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {demand.map((job) => (
                        <TableRow key={job.jobKey}>
                          <TableCell sx={{ fontWeight: 600 }}>{job.jobNumber}</TableCell>
                          <TableCell>{job.first}</TableCell>
                          <TableCell>{job.lists}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              )}
            </Box>

            <Box component='section' aria-labelledby='drivers-lists' sx={{ mt: 4, mb: 2 }}>
              <Typography id='drivers-lists' variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
                Drivers&apos; lists ({lists.length})
              </Typography>
              {lists.length === 0 ? (
                <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
                  No driver has a list for this week yet.
                </Typography>
              ) : (
                <Box
                  component='ul'
                  sx={{
                    m: 0,
                    mt: 1.5,
                    p: 0,
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                    gap: 2.5,
                  }}
                >
                  {lists.map((list) => (
                    <DriverList key={list.userId} list={list} />
                  ))}
                </Box>
              )}
            </Box>
          </>
        )
      )}
    </Paper>
  );
}
