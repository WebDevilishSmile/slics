'use client';

import { Box, Paper, Typography } from '@mui/material';

import { formatBidDay } from '@/lib/bidDay';
import { formatWeekEnding } from '@/lib/onCallSheet';
import CoverDispute from '@/components/covers/CoverDispute';
import SoftNotice from '@/components/utility/SoftNotice';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import { softInset, softRaised } from '@/components/utility/soft';
import { displayName } from '@/lib/names';

// What a week's tile says about the driver's spot (lib/coverDrivers.js
// myCoverSpot): a headline and a quieter line under it.
function describe(spot) {
  if (!spot) return { headline: 'Not on the list', detail: "You're not on this week's pick list." };
  // The super admin's preview: no real driver's place.
  if (spot.status === 'preview') return { headline: 'Cover #', detail: 'Your place on the pick list' };
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

function WeekTile({ weekEnding, spot, bidDate, index }) {
  const { headline, detail } = describe(spot);
  const isPreview = spot?.status === 'preview';
  const callIn = spot?.callIn || (isPreview ? 'Your time' : '');

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
            Call in{bidDate ? ` ${formatBidDay(bidDate)}` : ''}
          </Typography>
          <Typography
            variant='h6'
            component='p'
            sx={{ color: isPreview ? 'text.secondary' : 'primary.main', fontWeight: 700 }}
          >
            {callIn}
          </Typography>
        </Box>
      )}
    </Box>
  );
}

// A verified driver's own place on the cover list, one tile per posted week
// from this one on: "Cover 7", their call-in (pick) time and the day of it
// (`bidDate` on each week, lib/bidDay.js). Only their row:
// nobody else's name, status or picks reach the page (docs/COVER-BIDDING.md).
// `offWeeks` are the posted weeks they're not on, which are read only for
// them, with "This is a mistake" (covers/CoverDispute.jsx); `dispute` is
// their latest message about it, and `jobCode` the job they hold on the Jobs
// tab, which the notice names. `preview`: the super admin's preview, with
// placeholder places (app/covers/page.jsx).
export default function MyCoverWeeks({
  name,
  driverName,
  weeks,
  offWeeks,
  allOff,
  dispute,
  jobCode,
  preview = false,
}) {
  return (
    <Paper variant='panel' className='enter' sx={{ minHeight: 0, alignItems: 'stretch', gap: 2.5 }}>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='h6' component='p' sx={{ fontWeight: 700 }}>
          {name}
          <VerifiedBadge />
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {preview ? 'On the sheet as your name, as the sheet spells it' : `On the sheet as ${displayName(driverName)}`}
        </Typography>
      </Box>

      {offWeeks.length > 0 && (
        <CoverDispute
          offWeeks={offWeeks}
          allOff={allOff}
          driverName={displayName(driverName)}
          jobCode={jobCode}
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
