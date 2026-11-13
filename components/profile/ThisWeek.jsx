'use client';

import { useState } from 'react';
import {
  BeachAccessOutlined,
  ExpandMore,
  HelpOutlineOutlined,
  LocalShippingOutlined,
  PhoneInTalkOutlined,
  SwapHorizOutlined,
  WorkOutline,
} from '@mui/icons-material';
import { Box, Button, Collapse, Typography } from '@mui/material';

import { formatDayValue } from '@/lib/dayFormat';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { softPressSx, softRaisedSmall, softToggleSx } from '@/components/utility/soft';
import JobSchedule from '@/components/covers/JobSchedule';

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

      {week.schedule && <JobSchedule schedule={week.schedule} weekEnding={week.weekEnding} today={data.today} />}

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
                <JobSchedule schedule={data.ownJob.schedule} weekEnding={week.weekEnding} />
              </Box>
            )}
          </Collapse>
        </Box>
      )}
    </Box>
  );
}
