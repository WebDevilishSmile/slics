'use client';

import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import {
  BeachAccessOutlined,
  Close,
  HelpOutlineOutlined,
  LocalShippingOutlined,
  PhoneInTalkOutlined,
  SwapHorizOutlined,
  WorkOutline,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Skeleton,
  Typography,
  useMediaQuery,
} from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { formatBidDay } from '@/lib/bidDay';
import { formatDayValue } from '@/lib/dayFormat';
import { displayName } from '@/lib/names';
import { formatWeekEnding } from '@/lib/onCallSheet';
import JobSchedule from '@/components/covers/JobSchedule';
import { softInset, softPressSx } from '@/components/utility/soft';

// A driver's details on the Cover Drivers page (/admin/cover/drivers), opened
// by tapping their name: their place and work in the week the page shows,
// the job they hold on the Jobs tab, and their last weeks on the pick lists
// (GET /api/cover-drivers/[key], lib/db/coverDriverProfile.js). Read only.
// Mounted only while open.

const capitalize = (text) => String(text ?? '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
const shortWeek = (weekEnding) => formatWeekEnding(weekEnding).slice(0, -5);

// "Cover #4 · call in 5:30 AM · Thu 11/12", or why there's no place.
function placeLine(week) {
  if (!week.posted) return 'This week’s pick list isn’t posted yet.';
  const { place } = week;
  if (!place) return 'Not on this week’s pick list.';
  const number = place.number ? ` #${place.number}` : '';
  if (place.status === 'out') return `Cover${number} · out, no call-in`;
  if (place.status === 'unnumbered') return 'Cover · no number this week';
  const where = place.list === 'cover' ? `Cover${number}` : `On call${number}`;
  const callIn = place.callIn ? `call in ${formatDayValue(place.callIn)} · ${formatBidDay(week.bidDate)}` : null;
  return [where, callIn].filter(Boolean).join(' · ');
}

// The status line: an icon and the words, as the profile's This week card
// says them, for an admin.
function statusOf(assignment) {
  switch (assignment.kind) {
    case 'covering':
      return { icon: <SwapHorizOutlined />, text: `Covering ${assignment.jobNumber}` };
    case 'ownJob':
      return { icon: <WorkOutline />, text: `Own job · ${assignment.jobName}` };
    case 'onCall':
      return { icon: <PhoneInTalkOutlined />, text: 'On call' };
    case 'coverUnpicked':
      return { icon: <LocalShippingOutlined />, text: 'On cover · no job picked yet' };
    case 'off':
      return {
        icon: <BeachAccessOutlined />,
        text: `Off this week${assignment.status ? ` · ${capitalize(assignment.status)}` : ''}`,
      };
    case 'other':
      return { icon: <HelpOutlineOutlined />, text: `The sheet says “${assignment.text}”` };
    default:
      return { icon: <HelpOutlineOutlined />, text: 'No job this week' };
  }
}

// A recent week's place and outcome, in a few words.
function recentWords(entry) {
  if (!entry.onList) {
    if (entry.hasPicks) return { place: null, outcome: 'Not on the list' };
    return { place: null, outcome: entry.uploaded ? 'No pick list (photo upload)' : 'No pick list' };
  }
  const place =
    entry.list === 'cover'
      ? `Cover${entry.place ? ` #${entry.place}` : ''}`
      : `On call${entry.place ? ` #${entry.place}` : ''}`;
  const outcome = {
    covering: `Covered ${entry.jobNumber}`,
    ownJob: 'Own job',
    // The place already says it.
    onCall: entry.list === 'onCall' ? null : 'On call',
    coverUnpicked: 'No job picked',
    off: entry.leave ?? 'Out',
    other: entry.text ? `“${entry.text}”` : 'Something else',
  }[entry.kind] ?? '';
  return { place, outcome };
}

function totalsLine(recent) {
  const { totals, weeks } = recent;
  const listed = weeks.filter((entry) => entry.hasPicks).length;
  if (!totals) return listed ? `Not on the last ${listed} pick lists.` : null;
  return [
    `On ${totals.weeks} of ${listed} lists`,
    `covered ${totals.covering}`,
    totals.coverNoJob ? `no job ${totals.coverNoJob}` : null,
    totals.out ? `out ${totals.out}` : null,
    totals.avgPlace !== null ? `avg place ${totals.avgPlace}` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function Section({ id, title, children }) {
  return (
    <Box component='section' aria-labelledby={id} sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Typography id={id} variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function LoadingShape() {
  return (
    <Box aria-busy='true' aria-label='Loading driver' sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Skeleton variant='text' width='40%' height='2rem' />
      <Skeleton variant='text' width='70%' />
      <Skeleton variant='rounded' height='8rem' sx={{ borderRadius: 4 }} />
      <Skeleton variant='text' width='35%' height='2rem' sx={{ mt: 1 }} />
      <Skeleton variant='rounded' height='6rem' sx={{ borderRadius: 4 }} />
    </Box>
  );
}

export default function CoverDriverDialog({ name, weekEnding, onClose }) {
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [state, setState] = useState({ loading: true, error: '', data: null });

  useEffect(() => {
    let cancelled = false;
    apiRequest(`/api/cover-drivers/${encodeURIComponent(name)}?weekEnding=${weekEnding}`, { method: 'GET' }).then(
      ({ data, error }) => {
        if (!cancelled) setState({ loading: false, error: error ?? '', data: data?.data ?? null });
      },
    );
    return () => {
      cancelled = true;
    };
  }, [name, weekEnding]);

  const { loading, error, data } = state;
  const today = dayjs().format('YYYY-MM-DD');
  const status = data ? statusOf(data.week.assignment) : null;
  const ownJobThisWeek = data?.week.assignment.kind === 'ownJob';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth='sm' fullScreen={fullScreen} aria-labelledby='cover-driver-title'>
      <DialogTitle id='cover-driver-title' sx={{ pr: 7 }}>
        {data?.name ?? displayName(name)}
        <Typography component='span' variant='body2' color='text.secondary' sx={{ display: 'block' }}>
          W/E {formatWeekEnding(weekEnding)}
        </Typography>
      </DialogTitle>
      <IconButton
        onClick={onClose}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 4, pb: 4 }}>
        {loading && <LoadingShape />}
        {!loading && error && <Alert severity='error'>{error}</Alert>}

        {!loading && data && (
          <>
            <Section id='cover-driver-week' title='This week'>
              <Typography variant='body2' color='text.secondary'>
                {placeLine(data.week)}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ color: 'primary.main', display: 'flex' }}>{status.icon}</Box>
                <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{status.text}</Typography>
              </Box>
              {data.week.schedule && (
                <JobSchedule schedule={data.week.schedule} weekEnding={data.week.weekEnding} today={today} />
              )}
            </Section>

            <Section id='cover-driver-own-job' title='Own job'>
              {data.ownJob ? (
                <>
                  <Typography>
                    <Box component='span' sx={{ fontWeight: 700 }}>
                      {data.ownJob.jobName}
                    </Box>
                    {data.ownJob.seniority && ` · Seniority #${data.ownJob.seniority}`}
                    {data.ownJob.weekHours && ` · ${data.ownJob.weekHours} h a week`}
                  </Typography>
                  {ownJobThisWeek ? (
                    <Typography variant='body2' color='text.secondary'>
                      Working it this week, as above.
                    </Typography>
                  ) : (
                    data.ownJob.schedule && (
                      <JobSchedule schedule={data.ownJob.schedule} weekEnding={data.week.weekEnding} />
                    )
                  )}
                </>
              ) : (
                <Typography variant='body2' color='text.secondary'>
                  The Jobs tab doesn&apos;t list them on a job.
                </Typography>
              )}
            </Section>

            {data.recent.weeks.length > 0 && (
              <Section id='cover-driver-recent' title='Recent weeks'>
                {totalsLine(data.recent) && (
                  <Typography variant='body2' color='text.secondary'>
                    {totalsLine(data.recent)}
                  </Typography>
                )}
                <Box
                  component='ol'
                  sx={[
                    softInset,
                    { listStyle: 'none', m: 0, p: { xs: 1.5, sm: 2 }, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 1 },
                  ]}
                >
                  {data.recent.weeks.map((entry) => {
                    const { place, outcome } = recentWords(entry);
                    const current = entry.weekEnding === data.week.weekEnding;
                    return (
                      <Box
                        component='li'
                        key={entry.weekEnding}
                        aria-current={current ? 'true' : undefined}
                        sx={{ display: 'flex', alignItems: 'baseline', columnGap: 1.5, flexWrap: 'wrap' }}
                      >
                        <Typography
                          component='span'
                          variant='body2'
                          sx={{ fontWeight: 700, minWidth: '5.5rem', color: current ? 'primary.main' : 'text.primary' }}
                        >
                          W/E {shortWeek(entry.weekEnding)}
                        </Typography>
                        <Typography
                          component='span'
                          variant='body2'
                          sx={{ color: current ? 'primary.main' : entry.onList ? 'text.primary' : 'text.secondary' }}
                        >
                          {[place, outcome].filter(Boolean).join(' · ')}
                        </Typography>
                      </Box>
                    );
                  })}
                </Box>
              </Section>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
