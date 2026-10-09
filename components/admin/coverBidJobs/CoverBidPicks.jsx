'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Button,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import {
  softInset,
  softPressSx,
  softRaisedSmall,
  softTableSx,
} from '@/components/utility/soft';

const RECENT = 10;

function fieldLabel(field) {
  if (field.startsWith('pick')) return `Pick #${field.slice(4)}`;
  return { slot: 'Time', order: 'Order', job: 'Job / status' }[field] ?? field;
}

function describe(event) {
  if (event.field === 'added') return 'added to the list';
  if (event.field === 'removed') return 'removed from the list';
  return `${fieldLabel(event.field)}: ${event.from || '—'} → ${event.to || '—'}`;
}

// The pick section of the week's cover tab, as saved by the last refresh
// (docs/ON-CALL-SHEET-SYNC.md), and what changed between refreshes.
export default function CoverBidPicks({ picks, events, loading, error }) {
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <Stack spacing={1.5} sx={{ mt: 4 }} aria-busy='true' aria-label='Loading picks'>
        <Skeleton variant='text' width='8rem' />
        {[0, 1, 2].map((row) => (
          <Skeleton key={row} variant='rounded' height='2.5rem' />
        ))}
      </Stack>
    );
  }

  const rows = picks?.rows ?? [];
  // Only as many pick columns as anyone used, so the table fits on a phone.
  const pickColumns = Math.max(
    1,
    ...rows.map((row) => row.picks.findLastIndex(Boolean) + 1)
  );
  const shownEvents = showAll ? events : events.slice(0, RECENT);

  return (
    <Box component='section' aria-labelledby='cover-picks-heading' sx={{ mt: 4 }}>
      <Typography id='cover-picks-heading' variant='h6' component='h3'>
        Picks
      </Typography>
      {error && <Alert severity='error' sx={{ mt: 1 }}>{error}</Alert>}

      {!error && !picks && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1 }}>
          No picks saved for this week yet. Refresh it from the sheet to pull them.
        </Typography>
      )}

      {picks && (
        <>
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            From tab {picks.sheetTab} · refreshed{' '}
            {dayjs(picks.refreshed_at).format('MMM D, h:mm A')}
            {picks.refreshedBy?.name && ` by ${picks.refreshedBy.name}`}
          </Typography>

          <Box sx={{ overflowX: 'auto', mt: 1.5 }}>
            <Table size='small' sx={softTableSx} aria-labelledby='cover-picks-heading'>
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>#</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Job / status</TableCell>
                  {Array.from({ length: pickColumns }, (_, index) => (
                    <TableCell key={index}>Pick #{index + 1}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow key={`${row.name}-${index}`}>
                    <TableCell>{row.slot}</TableCell>
                    <TableCell>{row.order}</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>{row.name}</TableCell>
                    <TableCell>{row.job}</TableCell>
                    {row.picks.slice(0, pickColumns).map((pick, pickIndex) => (
                      <TableCell key={pickIndex} sx={{ fontWeight: pick ? 600 : undefined }}>
                        {pick}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </>
      )}

      {events.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant='subtitle1' component='h4' sx={{ fontWeight: 600 }}>
            Recent changes
          </Typography>
          <Box
            component='ul'
            sx={(theme) => ({
              ...softInset(theme),
              listStyle: 'none',
              m: 0,
              mt: 1,
              p: 2,
              borderRadius: 4,
              display: 'flex',
              flexDirection: 'column',
              gap: 1,
            })}
          >
            {shownEvents.map((event) => (
              <Box component='li' key={event._id} sx={{ typography: 'body2' }}>
                <Box component='span' sx={{ color: 'text.secondary' }}>
                  {dayjs(event.seenAt).format('MMM D, h:mm A')} ·{' '}
                </Box>
                <strong>{event.name}</strong> {describe(event)}
              </Box>
            ))}
          </Box>
          {events.length > RECENT && (
            <Button
              onClick={() => setShowAll((shown) => !shown)}
              aria-expanded={showAll}
              sx={[softRaisedSmall, softPressSx, { mt: 1.5, px: 3, minHeight: '2.5rem' }]}
            >
              {showAll ? 'Show fewer' : `Show all ${events.length}`}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
