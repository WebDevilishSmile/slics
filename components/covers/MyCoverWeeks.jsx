'use client';

import { Box, Paper, Typography } from '@mui/material';

import { formatBidDay } from '@/lib/bidDay';
import { formatWeekEnding } from '@/lib/onCallSheet';
import CoverDispute from '@/components/covers/CoverDispute';
import SoftNotice from '@/components/utility/SoftNotice';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import { softInset, softRaised } from '@/components/utility/soft';
import { displayName } from '@/lib/names';

// What the week's tile says about the driver's spot (lib/coverDrivers.js
// myCoverSpot): a headline and a quieter line under it.
function describe(spot) {
  if (!spot) return { headline: 'Not on the list', detail: "You're not on the pick list." };
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

function WeekTile({ weekEnding, spot, bidDate }) {
  const { headline, detail } = describe(spot);
  const isPreview = spot?.status === 'preview';
  const callIn = spot?.callIn || (isPreview ? 'Your time' : '');

  return (
    <Box
      className='enter'
      sx={[
        softRaised,
        { borderRadius: 4, p: 2.5, display: 'flex', alignItems: 'center', gap: 2 },
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

// A verified driver's own place on the cover list for one week, the one bid
// on this week (`week.weekEnding`, lib/bidDay.js currentBidWeek: from Sunday,
// next week's): "Cover 7", their call-in (pick) time and the day of it
// (`week.bidDate`), or that its pick list isn't posted yet (`week.posted`).
// Only their row: nobody else's name, status or picks reach the page
// (docs/COVER-BIDDING.md). `offWeeks` is that week when they're not on it,
// which makes it read only for them, with "This is a mistake"
// (covers/CoverDispute.jsx); `dispute` is their latest message about it, and
// `jobCode` the job they hold on the Jobs tab, which the notice names.
// `preview`: the super admin's preview, with a placeholder place
// (app/covers/page.jsx).
export default function MyCoverWeeks({
  name,
  driverName,
  week,
  offWeeks,
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
          driverName={displayName(driverName)}
          jobCode={jobCode}
          initialDispute={dispute}
        />
      )}

      {week.posted ? (
        <WeekTile weekEnding={week.weekEnding} spot={week.spot} bidDate={week.bidDate} />
      ) : (
        <SoftNotice>
          Your place for the week ending {formatWeekEnding(week.weekEnding)} shows once its
          pick list is posted.
        </SoftNotice>
      )}
    </Paper>
  );
}
