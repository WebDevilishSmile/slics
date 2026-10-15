'use client';

import dayjs from 'dayjs';
import Link from '@/components/utility/NextLink';
import { useState } from 'react';
import {
  BeachAccessOutlined,
  ChevronRight,
  ExpandMore,
  HelpOutlineOutlined,
  LocalShippingOutlined,
  PhoneInTalkOutlined,
  SwapHorizOutlined,
  WorkOutline,
} from '@mui/icons-material';
import { Box, Button, Collapse, Typography } from '@mui/material';

import { DAY_FIELDS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { softInset, softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';

// The This week section on a verified driver's profile (lib/db/driverWeeks.js,
// as toDriverWeek in lib/serializers.js shapes it): what they work this week,
// and next week once its cover list names them. On cover, the job they're
// covering, each day it works with its start time and its route, every stop a
// link to its SLIC. Otherwise their own job the same way, or that they're on
// call or off. Their own job sits folded under a cover week. A section open on
// the profile panel, its days in a pressed-in well, like Account below it.

const capitalize = (text) => String(text ?? '').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// The status line: an icon and the words, brand blue.
function statusOf(assignment) {
  const callIn = assignment.callIn ? `call in ${formatDayValue(assignment.callIn)}` : null;
  switch (assignment.kind) {
    case 'covering':
      return { icon: <SwapHorizOutlined />, text: `On cover · covering ${assignment.jobNumber}`, sub: callIn };
    case 'ownJob':
      return { icon: <WorkOutline />, text: `Your job · ${assignment.jobName}` };
    case 'onCall':
      return { icon: <PhoneInTalkOutlined />, text: 'On call', sub: callIn };
    case 'coverUnpicked':
      return {
        icon: <LocalShippingOutlined />,
        text: `On cover${assignment.position ? ` · #${assignment.position}` : ''}`,
        sub: ['No job picked yet', callIn].filter(Boolean).join(' · '),
      };
    case 'off':
      return {
        icon: <BeachAccessOutlined />,
        text: `Off this week${assignment.status ? ` · ${capitalize(assignment.status)}` : ''}`,
      };
    case 'other':
      return { icon: <HelpOutlineOutlined />, text: `This week · ${assignment.text}` };
    default:
      return {
        icon: <HelpOutlineOutlined />,
        text: 'No job this week',
        sub: 'The Jobs tab doesn’t list you on a job, and the cover list doesn’t name you.',
      };
  }
}

// One stop on a route: a pill linking to its SLIC's card, or plain text for a
// code that isn't a SLIC (a yard, "SHUTTLE").
function Stop({ stop }) {
  const pillSx = {
    borderRadius: 999,
    px: 1,
    minHeight: '2.5rem',
    display: 'inline-flex',
    alignItems: 'center',
    typography: 'body2',
    fontWeight: 700,
  };
  if (!stop.numSlic) {
    return (
      <Box component='span' sx={[pillSx, { color: 'text.secondary', px: 0.5 }]}>
        {stop.code}
      </Box>
    );
  }
  const alpha = stop.alpha ? `&alpha=${encodeURIComponent(stop.alpha)}` : '';
  return (
    <Box
      component={Link}
      href={`/home?slic=${encodeURIComponent(stop.numSlic)}${alpha}`}
      aria-label={`Look up ${stop.code}, SLIC ${stop.numSlic}`}
      sx={[softRaisedSmall, softPressSx, pillSx, { color: 'primary.main', textDecoration: 'none' }]}
    >
      {stop.code}
    </Box>
  );
}

const sameDay = (a, b) =>
  a.start === b.start &&
  a.hours === b.hours &&
  a.miles === b.miles &&
  a.route === b.route &&
  DAY_FIELDS.indexOf(b.day) === DAY_FIELDS.indexOf(a.day) + 1;

// Working days in a row that start, run and route the same are one entry
// ("Mon–Thu"), so a Monday-to-Friday job is one route, not five.
function groupDays(days) {
  const groups = [];
  for (const day of days) {
    const last = groups[groups.length - 1];
    if (last && sameDay(last.days[last.days.length - 1], day)) last.days.push(day);
    else groups.push({ ...day, days: [day] });
  }
  return groups;
}

// The week's days in a pressed-in well: each working day (or run of days)
// with its dates, start time, hours and miles when the Jobs tab has them, and
// the route. Today is marked in words and brand blue, unless `today` is null
// (the folded own job on a cover week: not what they work today). Off days
// are one line at the end.
function Schedule({ schedule, weekEnding, today = null }) {
  const working = schedule.days.filter((day) => day.works);
  const groups = groupDays(working);
  const offDays = schedule.days.filter((day) => !day.works).map((day) => DAY_LABELS[day.day]);
  const dateOf = (day) => dayjs(weekEnding).subtract(6 - DAY_FIELDS.indexOf(day), 'day');

  return (
    <Box sx={[softInset, { borderRadius: 4, p: { xs: 1.5, sm: 2 }, display: 'flex', flexDirection: 'column', gap: 2 }]}>
      {working.length === 0 && !schedule.description && (
        <Typography variant='body2' color='text.secondary'>
          The sheet has no days or times for this job.
        </Typography>
      )}
      {groups.map((group) => {
        const first = group.days[0].day;
        const last = group.days[group.days.length - 1].day;
        const run = first !== last;
        const isToday = Boolean(today) && group.days.some((entry) => dateOf(entry.day).format('YYYY-MM-DD') === today);
        const label = run ? `${DAY_LABELS[first]}–${DAY_LABELS[last]}` : DAY_LABELS[first];
        const dates = run
          ? `${dateOf(first).format('M/D')}–${dateOf(last).format('M/D')}`
          : dateOf(first).format('M/D');
        const details = [group.hours && `${group.hours} h`, group.miles && `${group.miles} mi`]
          .filter(Boolean)
          .join(' · ');
        return (
          <Box key={first} component='section' aria-label={`${label} ${dates}${isToday ? ', today' : ''}`}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', columnGap: 1, flexWrap: 'wrap' }}>
              <Typography component='span' sx={{ fontWeight: 700, color: isToday ? 'primary.main' : 'text.primary' }}>
                {label}
              </Typography>
              <Typography component='span' variant='body2' color={isToday ? 'primary.main' : 'text.secondary'}>
                {dates}
                {isToday && ' · Today'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'baseline', columnGap: 1, flexWrap: 'wrap' }}>
              <Typography
                component='span'
                variant='h6'
                sx={{ fontWeight: 700, color: isToday ? 'primary.main' : 'text.primary' }}
              >
                {group.start ? formatDayValue(group.start) : 'No start time'}
              </Typography>
              {details && (
                <Typography component='span' variant='body2' color='text.secondary'>
                  {details}
                </Typography>
              )}
            </Box>
            {group.stops.length > 0 && (
              <Box
                component='ol'
                aria-label='Route'
                sx={{ listStyle: 'none', m: 0, mt: 0.75, p: 0, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.5 }}
              >
                {group.stops.map((stop, index) => (
                  <Box
                    component='li'
                    key={`${stop.code}-${index}`}
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.25 }}
                  >
                    {index > 0 && (
                      <ChevronRight fontSize='small' aria-hidden='true' sx={{ color: 'text.secondary', mx: -0.25 }} />
                    )}
                    <Stop stop={stop} />
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        );
      })}
      {schedule.description && (
        <Typography variant='body2' sx={{ whiteSpace: 'pre-line' }}>
          {schedule.description}
        </Typography>
      )}
      {offDays.length > 0 && working.length > 0 && (
        <Typography variant='body2' color='text.secondary'>
          Off: {offDays.join(', ')}
        </Typography>
      )}
    </Box>
  );
}

export default function ThisWeek({ data }) {
  const [which, setWhich] = useState('this');
  const [ownOpen, setOwnOpen] = useState(false);
  const week = data.weeks.find((entry) => entry.which === which) ?? data.weeks[0];
  if (!week) return null;

  const status = statusOf(week.assignment);
  const showOwnJob = data.ownJob && week.assignment.kind !== 'ownJob';

  return (
    <Box
      component='section'
      aria-labelledby='this-week-heading'
      sx={{ alignSelf: 'stretch', display: 'flex', flexDirection: 'column', gap: 2 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography id='this-week-heading' variant='h6' component='h2' sx={{ fontWeight: 700 }}>
            {week.which === 'next' ? 'Next week' : 'This week'}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            W/E {formatWeekEnding(week.weekEnding)}
          </Typography>
        </Box>
        {data.weeks.length > 1 && (
          <Box role='group' aria-label='Week' sx={{ display: 'flex', gap: 1 }}>
            {data.weeks.map((entry) => (
              <Button
                key={entry.which}
                size='small'
                aria-pressed={entry.which === week.which}
                onClick={() => setWhich(entry.which)}
                sx={[softToggleSx, { borderRadius: 999, px: 1.75, minHeight: '2.5rem', textTransform: 'none', color: 'text.primary' }]}
              >
                {entry.which === 'next' ? 'Next' : 'This'}
              </Button>
            ))}
          </Box>
        )}
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Box sx={{ color: 'primary.main', display: 'flex', pt: 0.25 }}>{status.icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{status.text}</Typography>
          {status.sub && (
            <Typography variant='body2' color='text.secondary'>
              {status.sub}
            </Typography>
          )}
          {week.which === 'this' && !week.posted && (
            <Typography variant='body2' color='text.secondary'>
              This week&apos;s cover list isn&apos;t posted yet.
            </Typography>
          )}
        </Box>
      </Box>

      {week.schedule && <Schedule schedule={week.schedule} weekEnding={week.weekEnding} today={data.today} />}

      {showOwnJob && (
        <Box>
          <Button
            onClick={() => setOwnOpen((open) => !open)}
            aria-expanded={ownOpen}
            aria-controls='own-job-schedule'
            endIcon={
              <ExpandMore
                sx={(theme) => ({
                  transition: theme.transitions.create('transform', { easing: theme.transitions.easing.out }),
                  transform: ownOpen ? 'rotate(180deg)' : 'none',
                })}
              />
            }
            sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', px: 2, textTransform: 'none', color: 'text.primary' }]}
          >
            Your job · {data.ownJob.jobName}
          </Button>
          <Collapse in={ownOpen} id='own-job-schedule'>
            {data.ownJob.schedule && (
              <Box sx={{ pt: 2 }}>
                <Schedule schedule={data.ownJob.schedule} weekEnding={week.weekEnding} />
              </Box>
            )}
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
