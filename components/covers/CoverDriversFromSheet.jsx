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
import SheetRefreshButton from '@/components/admin/coverBidJobs/SheetRefreshButton';
import { softTableSx } from '@/components/utility/soft';
import { useCoverBidPicks } from '@/hooks/useCoverBidPicks';
import { COVER_POSITIONS, coverDriversFromPicks } from '@/lib/coverDrivers';
import { getUpcomingSaturday } from '@/lib/format';
import theme from '@/theme';

// Cover rows → table rows. The line under a name is the job or status, or why
// the row is empty.
function coverRow(driver, index) {
  const base = { key: `${driver.position ?? 'x'}-${index}`, number: driver.position, callIn: driver.callIn };
  if (driver.status === 'vacant') {
    return { ...base, name: '', detail: `No driver numbered ${driver.position} on this tab`, muted: true };
  }
  if (driver.status === 'out') {
    return { ...base, name: driver.name, detail: `Out this week${driver.job ? ` · ${driver.job}` : ''}`, muted: true };
  }
  if (driver.status === 'unnumbered') {
    return { ...base, name: driver.name, detail: driver.job || 'No number this week', muted: true };
  }
  return { ...base, name: driver.name, detail: driver.job, muted: false };
}

function onCallRow(driver, index) {
  const unnumbered = driver.order === null;
  return {
    key: `${driver.name}-${index}`,
    number: driver.order,
    name: driver.name,
    detail: driver.job || (unnumbered ? 'No number this week' : ''),
    callIn: driver.callIn,
    muted: unnumbered,
  };
}

function DriversTable({ id, title, rows }) {
  return (
    <Box component='section' aria-labelledby={id} sx={{ mt: 3 }}>
      <Typography id={id} variant='subtitle1' component='h4' sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {/* Scrolls sideways rather than bursting the panel on a narrow phone. */}
      <Box sx={{ overflowX: 'auto', mt: 1 }}>
        <Table size='small' sx={softTableSx} aria-labelledby={id}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '3rem' }}>#</TableCell>
              <TableCell>Driver · job / status</TableCell>
              <TableCell sx={{ width: '5rem', whiteSpace: 'nowrap' }}>Call-in</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell>{row.number}</TableCell>
                <TableCell>
                  {row.name && (
                    <Box
                      component='span'
                      sx={{ display: 'block', color: row.muted ? 'text.secondary' : undefined }}
                    >
                      {row.name}
                    </Box>
                  )}
                  {row.detail && (
                    <Typography component='span' variant='body2' color='text.secondary'>
                      {row.detail}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>{row.callIn}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Box>
  );
}

// The week's cover and on-call drivers from the on-call sheet: pick order 1–20
// on the week's tab are cover, everyone after driver 20 is on call
// (lib/coverDrivers.js). Reads what the last refresh saved; the Refresh button
// reads the sheet.
export default function CoverDriversFromSheet() {
  // Next week, the week being posted, as on /admin/cover/jobs.
  const [selectedDay, setSelectedDay] = useState(() => dayjs().add(1, 'week'));
  const [refreshKey, setRefreshKey] = useState(0);
  const weekEndDate = useMemo(() => getUpcomingSaturday(selectedDay), [selectedDay]);
  const { picks, loading, error } = useCoverBidPicks({ weekEndDate, refreshKey });
  const { cover, onCall } = useMemo(
    () => (picks ? coverDriversFromPicks(picks.rows) : { cover: [], onCall: [] }),
    [picks],
  );

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
      <SheetRefreshButton
        key={weekEndDate.format('YYYY-MM-DD')}
        weekEndDate={weekEndDate}
        onRefreshed={() => setRefreshKey((key) => key + 1)}
      />

      <Box component='section' aria-labelledby='cover-drivers-heading' sx={{ mt: 4 }}>
        <Typography id='cover-drivers-heading' variant='h6' component='h3'>
          W/E {weekEndDate.format('M/D/YYYY')}
        </Typography>

        {loading && (
          <Stack spacing={1.5} sx={{ mt: 1.5 }} aria-busy='true' aria-label='Loading drivers'>
            {[0, 1, 2, 3].map((row) => (
              <Skeleton key={row} variant='rounded' height='2.5rem' />
            ))}
          </Stack>
        )}

        {!loading && error && <Alert severity='error' sx={{ mt: 1 }}>{error}</Alert>}

        {!loading && !error && !picks && (
          <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
            This week isn&apos;t saved yet. Refresh it from the sheet to pull its drivers.
          </Typography>
        )}

        {!loading && picks && (
          <>
            <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
              From the sheet, tab {picks.sheetTab} · refreshed{' '}
              {dayjs(picks.refreshed_at).format('MMM D, h:mm A')}
            </Typography>
            <DriversTable
              id='cover-list-heading'
              title={`Cover drivers (1–${COVER_POSITIONS})`}
              rows={cover.map(coverRow)}
            />
            <DriversTable id='on-call-heading' title='On call' rows={onCall.map(onCallRow)} />
          </>
        )}
      </Box>
    </Paper>
  );
}
