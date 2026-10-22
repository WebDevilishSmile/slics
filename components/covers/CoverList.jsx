'use client';

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Typography,
} from '@mui/material';
import {
  ArrowDownward,
  ArrowUpward,
  CloseOutlined,
  PhoneOutlined,
} from '@mui/icons-material';
import { visuallyHidden } from '@mui/utils';

import { formatBidDay } from '@/lib/bidDay';
import { DAY_FIELDS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';
import { formatWeekEnding } from '@/lib/onCallSheet';
import {
  softContainedSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';

// "Mon–Fri 06:00" when every day starts at the same time, otherwise each day
// with its time ("Mon 06:00 · Tue 07:30").
function daysSummary(job) {
  if (!job) return '';
  const days = DAY_FIELDS.filter((day) => job[day]);
  if (days.length === 0) return '';
  const times = new Set(days.map((day) => job[day]));
  if (times.size === 1) {
    const span =
      days.length > 2 && DAY_FIELDS.indexOf(days.at(-1)) - DAY_FIELDS.indexOf(days[0]) === days.length - 1
        ? `${DAY_LABELS[days[0]]}–${DAY_LABELS[days.at(-1)]}`
        : days.map((day) => DAY_LABELS[day]).join(' ');
    return `${span} ${formatDayValue(job[days[0]])}`;
  }
  return days.map((day) => `${DAY_LABELS[day]} ${formatDayValue(job[day])}`).join(' · ');
}

const moveButtonSx = [softPressSx, { width: '2.75rem', height: '2.75rem' }];

// A verified driver's list for one week on /covers (docs/COVER-BIDDING.md,
// stage 2): the jobs they want, in order, ready to read off when they call
// dispatch at their call-in time. Jobs someone took drop off the list (they
// show quietly under it, and come back if they open up again). Move up, move
// down and remove save at once (CoverBoard does the saving).
// - `entries`: [{ jobKey, jobNumber, status }] (lib/coverList.js).
// - `jobsByKey`: the week's driver rows by jobKey, for each job's days.
// - `editable`: false for a week that's over, or one the driver is off.
// - `offList`: the driver isn't on this week's posted pick list, so the list
//   is read only and there's no call to make.
// - `callIn`: the driver's call-in time that week, when they're on the list.
// - `bidDate`: the day they call in (lib/bidDay.js).
// - `dispatchPhone`: BETPA's phone (DISPATCH_NUM_SLIC), or null.
export default function CoverList({
  weekEnding,
  entries,
  jobsByKey,
  editable,
  offList,
  saving,
  error,
  announcement,
  callIn,
  bidDate,
  dispatchPhone,
  onMove,
  onRemove,
}) {
  const open = entries.filter((entry) => entry.status === 'open');
  const taken = entries.filter((entry) => entry.status !== 'open');

  return (
    <Box
      component='section'
      aria-labelledby='cover-list-title'
      sx={[softRaised, { borderRadius: 4, p: { xs: 2, sm: 3 }, my: 2.5 }]}
    >
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 2 }}>
        <Typography id='cover-list-title' variant='h5' component='h2' sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          Your list
        </Typography>
        <Typography variant='body2' color='text.secondary' sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {saving && <CircularProgress size={14} aria-label='Saving' />}
          Week ending {formatWeekEnding(weekEnding)}
        </Typography>
      </Box>
      <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
        {editable
          ? 'The jobs you want, in order. Add them with + in the jobs below. Taken jobs drop off.'
          : offList
            ? "You're not on this week's cover or on-call list, so your list is read only."
            : 'This week is over. Your list is kept for four weeks.'}
      </Typography>

      {error && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={[softInset, { mt: 2, borderRadius: 3, p: 1 }]}>
        {open.length === 0 ? (
          <Typography color='text.secondary' sx={{ p: 1.5 }}>
            {taken.length > 0 ? 'Every job on your list has been taken.' : 'No jobs on your list yet.'}
          </Typography>
        ) : (
          <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0 }}>
            {open.map((entry, index) => {
              const job = jobsByKey.get(entry.jobKey);
              return (
                <Box
                  component='li'
                  key={entry.jobKey}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1, py: 0.75 }}
                >
                  <Box
                    aria-hidden='true'
                    sx={[
                      softRaisedSmall,
                      {
                        width: '2rem',
                        height: '2rem',
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'primary.main',
                        typography: 'body2',
                        fontWeight: 800,
                      },
                    ]}
                  >
                    {index + 1}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700 }}>
                      <Box component='span' sx={visuallyHidden}>
                        Choice {index + 1}:{' '}
                      </Box>
                      {entry.jobNumber}
                    </Typography>
                    <Typography variant='body2' color='text.secondary'>
                      {daysSummary(job)}
                    </Typography>
                  </Box>
                  {editable && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                      <IconButton
                        aria-label={`Move ${entry.jobNumber} up`}
                        disabled={index === 0}
                        onClick={() => onMove(entry.jobKey, -1)}
                        sx={moveButtonSx}
                      >
                        <ArrowUpward fontSize='small' />
                      </IconButton>
                      <IconButton
                        aria-label={`Move ${entry.jobNumber} down`}
                        disabled={index === open.length - 1}
                        onClick={() => onMove(entry.jobKey, 1)}
                        sx={moveButtonSx}
                      >
                        <ArrowDownward fontSize='small' />
                      </IconButton>
                      <IconButton
                        aria-label={`Remove ${entry.jobNumber} from your list`}
                        onClick={() => onRemove(entry.jobKey)}
                        sx={moveButtonSx}
                      >
                        <CloseOutlined fontSize='small' />
                      </IconButton>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {taken.length > 0 && (
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1.5, px: 1 }}>
          Taken since you added {taken.length === 1 ? 'it' : 'them'}:{' '}
          <Box component='span' sx={{ fontWeight: 700 }}>
            {taken.map((entry) => entry.jobNumber).join(', ')}
          </Box>
          . {taken.length === 1 ? 'It comes' : 'They come'} back if {taken.length === 1 ? 'it opens' : 'they open'} up again.
        </Typography>
      )}

      {dispatchPhone && !offList && (
        <Box sx={{ mt: 2.5, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 2 }}>
          <Button
            variant='contained'
            href={`tel:${dispatchPhone}`}
            startIcon={<PhoneOutlined />}
            sx={[softContainedSx, { minHeight: '3rem', px: 3 }]}
          >
            Call dispatch
          </Button>
          <Typography variant='body2' color='text.secondary'>
            {callIn ? (
              <>
                Your call-in:{' '}
                <Box component='span' sx={{ color: 'text.primary', fontWeight: 700 }}>
                  {bidDate ? `${formatBidDay(bidDate)} at ${callIn}` : callIn}
                </Box>
                {' · '}
              </>
            ) : null}
            BETPA {dispatchPhone}
          </Typography>
        </Box>
      )}

      <Box aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
    </Box>
  );
}
