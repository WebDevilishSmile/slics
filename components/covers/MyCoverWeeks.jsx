'use client';

import { Box, Paper, Typography } from '@mui/material';

import { formatWeekEnding } from '@/lib/onCallSheet';
import CoverDispute from '@/components/covers/CoverDispute';
import SoftNotice from '@/components/utility/SoftNotice';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import { softInset, softRaised } from '@/components/utility/soft';

// What a week's tile says about the driver's spot (lib/coverDrivers.js
// myCoverSpot): a headline and a quieter line under it.
function describe(spot) {
  if (!spot) return { headline: 'Not on the list', detail: "You're not on this week's pick list." };
  if (spot.kind === 'onCall') {
    return { headline: spot.order ? `On call #${spot.order}` : 'On call', detail: spot.job };
  }
  if (spot.status === 'out') {
    return { headline: `Cover ${spot.position}`, detail: `Out this week${spot.job ? ` · ${spot.job}` : ''}` };
  }
  if (spot.status === 'unnumbered') {
    return { headline: 'Cover', detail: spot.job || 'No number this week' };
  }
  return { headline: `Cover ${spot.position}`, detail: spot.job };
}

function WeekTile({ weekEnding, spot, index }) {
  const { headline, detail } = describe(spot);
  const callIn = spot?.callIn;

  return (
    <Box
      component='li'
      className='enter'
      sx={[
        softRaised,
        { '--i': index, borderRadius: 4, p: 2.5, display: 'flex', alignItems: 'center', gap: 2 },
      ]}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant='body2' color='text.secondary'>
          Week ending {formatWeekEnding(weekEnding)}
        </Typography>
        <Typography
          variant='h5'
          component='p'
          sx={{ fontWeight: 700, color: spot ? 'text.primary' : 'text.secondary' }}
        >
          {headline}
        </Typography>
        {detail && (
          <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
            {detail}
          </Typography>
        )}
      </Box>
      {callIn && (
        <Box
          sx={[
            softInset,
            { borderRadius: 3, px: 2, py: 1, textAlign: 'center', flexShrink: 0 },
          ]}
        >
          <Typography variant='caption' color='text.secondary' component='p'>
            Call in
          </Typography>
          <Typography variant='h6' component='p' sx={{ color: 'primary.main', fontWeight: 700 }}>
            {callIn}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// A verified driver's own place on the cover list, one tile per posted week
// from this one on: "Cover 7", their call-in (pick) time. Only their row:
// nobody else's name, status or picks reach the page (docs/COVER-BIDDING.md).
// `offWeeks` are the posted weeks they're not on, which are read only for
// them, with "This is a mistake" (covers/CoverDispute.jsx); `dispute` is
// their latest message about it.
export default function MyCoverWeeks({ name, driverName, weeks, offWeeks, allOff, dispute }) {
  return (
    <Paper variant='panel' className='enter' sx={{ minHeight: 0, alignItems: 'stretch', gap: 2.5 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='h6' component='p' sx={{ fontWeight: 700 }}>
          {name}
          <VerifiedBadge />
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          On the sheet as {driverName}
        </Typography>
      </Box>

      {offWeeks.length > 0 && (
        <CoverDispute
          offWeeks={offWeeks}
          allOff={allOff}
          driverName={driverName}
          initialDispute={dispute}
        />
      )}

      {weeks.length === 0 ? (
        <SoftNotice>This week&apos;s pick list isn&apos;t posted yet.</SoftNotice>
      ) : (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2 }}>
          {weeks.map((week, index) => (
            <WeekTile key={week.weekEnding} index={index} {...week} />
          ))}
        </Box>
      )}
    </Paper>
  );
}
