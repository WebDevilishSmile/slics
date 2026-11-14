'use client';

import dayjs from 'dayjs';
import Link from '@/components/utility/NextLink';
import { ChevronRight } from '@mui/icons-material';
import { Box, Typography } from '@mui/material';

import { DAY_FIELDS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';
import { softInset, softPressSx, softRaisedSmall } from '@/components/utility/soft';

// A job's week as a pressed-in well (lib/driverWeek.js jobSchedule, shaped by
// toSchedule in lib/serializers.js): each working day or run of days with its
// start time and route, every stop a link to its SLIC. Shared by a verified
// driver's This week card on /profile (profile/ThisWeek.jsx), the admins'
// driver details on /admin/cover/drivers (covers/CoverDriverDialog.jsx) and a
// job's details on the drivers' /jobs (jobs/JobDialog.jsx).

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
// are one line at the end. Without `weekEnding` the days carry no dates: a
// bid job as it runs every week (/jobs).
export default function JobSchedule({ schedule, weekEnding = null, today = null }) {
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
        const isToday =
          Boolean(today && weekEnding) &&
          group.days.some((entry) => dateOf(entry.day).format('YYYY-MM-DD') === today);
        const label = run ? `${DAY_LABELS[first]}–${DAY_LABELS[last]}` : DAY_LABELS[first];
        const dates = !weekEnding
          ? ''
          : run
            ? `${dateOf(first).format('M/D')}–${dateOf(last).format('M/D')}`
            : dateOf(first).format('M/D');
        const details = [group.hours && `${group.hours} h`, group.miles && `${group.miles} mi`]
          .filter(Boolean)
          .join(' · ');
        return (
          <Box
            key={first}
            component='section'
            aria-label={`${label}${dates ? ` ${dates}` : ''}${isToday ? ', today' : ''}`}
          >
            <Box sx={{ display: 'flex', alignItems: 'baseline', columnGap: 1, flexWrap: 'wrap' }}>
              <Typography component='span' sx={{ fontWeight: 700, color: isToday ? 'primary.main' : 'text.primary' }}>
                {label}
              </Typography>
              {dates && (
                <Typography component='span' variant='body2' color={isToday ? 'primary.main' : 'text.secondary'}>
                  {dates}
                  {isToday && ' · Today'}
                </Typography>
              )}
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

