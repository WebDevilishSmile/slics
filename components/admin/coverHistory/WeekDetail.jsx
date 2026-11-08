'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import Link from '@/components/utility/NextLink';
import { ChevronLeftOutlined, ChevronRightOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import CoverCalendar from '@/components/covers/Calendar';
import { describeCoverJobChange, changeJob } from '@/components/admin/coverBidJobs/coverJobChangeText';
import { describePickEvent } from '@/components/admin/coverBidJobs/pickEventText';
import { formatWhen } from '@/components/admin/hub/format';
import { softInset, softPressSx, softRaised, softRaisedSmall, softTableSx, softToggleSx } from '@/components/utility/soft';
import { getUpcomingSaturday } from '@/lib/format';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { displayName } from '@/lib/names';

const HIDDEN = { admin: 'Hidden by an admin', sheet: 'Hidden in sheet', sleeper: 'Sleeper job' };
const LOG_PAGE = 30;

function Stat({ label, value, detail }) {
  return (
    <Box component='li' sx={[softRaised, { borderRadius: 4, p: 2, minWidth: 0 }]}>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography component='p' sx={{ typography: 'h5', fontWeight: 700 }}>
        {value ?? '—'}
      </Typography>
      {detail && (
        <Typography variant='body2' color='text.secondary'>
          {detail}
        </Typography>
      )}
    </Box>
  );
}

function outcome(driver) {
  switch (driver.kind) {
    case 'covering':
      return `Covered ${driver.jobNumber}`;
    case 'onCall':
      return 'On call';
    case 'coverUnpicked':
      return 'No job';
    case 'off':
      return `Out · ${driver.leave}`;
    case 'other':
      return driver.text;
    default:
      return '—';
  }
}

function Section({ title, children }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
      <Typography component='h4' sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

// "A week up close": one week as it closed, the one in `?week=`. Its numbers,
// every job with who covered it and at which place, the pick list's outcome
// by place, and the change log oldest first. The calendar and arrows move
// between saved weeks (`onWeek`); a week outside the range opens with All.
export default function WeekDetail({ detail, weeks, onWeek, pending }) {
  const [tab, setTab] = useState('jobs');
  const [showLog, setShowLog] = useState(false);
  const { summary } = detail;
  const saved = new Set(weeks);
  // `weeks` is newest first.
  const index = weeks.indexOf(detail.weekEnding);
  const older = weeks[index + 1];
  const newer = weeks[index - 1];
  const log = showLog ? detail.log.entries : detail.log.entries.slice(0, LOG_PAGE);
  const hiddenCount = summary.hidden.admin + summary.hidden.sheet + summary.hidden.sleeper;

  const pickWeek = (day) => {
    const weekEnding = getUpcomingSaturday(day).format('YYYY-MM-DD');
    if (saved.has(weekEnding)) onWeek(weekEnding);
  };

  return (
    <Box
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, opacity: pending ? 0.6 : 1, transition: 'opacity 150ms' }}
      aria-busy={pending}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <IconButton
          aria-label='Older week'
          disabled={!older}
          onClick={() => onWeek(older)}
          sx={[softRaisedSmall, softPressSx]}
        >
          <ChevronLeftOutlined />
        </IconButton>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <CoverCalendar value={dayjs(detail.weekEnding)} setValue={pickWeek} postedWeeks={saved} />
        </Box>
        <IconButton
          aria-label='Newer week'
          disabled={!newer}
          onClick={() => onWeek(newer)}
          sx={[softRaisedSmall, softPressSx]}
        >
          <ChevronRightOutlined />
        </IconButton>
      </Box>

      <Box
        component='ul'
        sx={{
          listStyle: 'none',
          m: 0,
          p: 0,
          display: 'grid',
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(4, minmax(0, 1fr))' },
          gap: { xs: 1.5, sm: 2 },
        }}
      >
        <Stat
          label='Jobs'
          value={summary.shown}
          detail={
            summary.taken === null
              ? `Photo upload${hiddenCount ? ` · ${hiddenCount} hidden` : ''}`
              : `${summary.taken} taken · ${summary.open} open${hiddenCount ? ` · ${hiddenCount} hidden` : ''}`
          }
        />
        <Stat
          label='On the pick list'
          value={summary.hasPicks ? summary.listed : null}
          detail={summary.hasPicks ? `${summary.onCall} on call · ${summary.out} out` : 'No pick list saved'}
        />
        <Stat
          label='Jobs reached place'
          value={summary.deepestPlace}
          detail={summary.hasPicks ? `${summary.onCallCovering} to on-call drivers` : null}
        />
        <Stat
          label='Changes'
          value={summary.jobChanges + summary.pickChanges}
          detail={`${summary.jobChanges} jobs · ${summary.pickChanges} pick list`}
        />
      </Box>

      {(detail.bidDate || detail.listTotals) && (
        <Typography variant='body2' color='text.secondary'>
          {detail.bidDate && `Bid day moved to ${formatWeekEnding(detail.bidDate)}. `}
          {detail.listTotals && `${detail.listTotals.lists} drivers kept a cover list.`}
        </Typography>
      )}

      <Box role='group' aria-label='Show' sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {[
          ['jobs', 'Jobs'],
          ['drivers', 'Pick list'],
          ['log', `Changes (${detail.log.entries.length})`],
        ].map(([key, label]) => (
          <Button
            key={key}
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            sx={[softToggleSx, { minHeight: '2.75rem', px: 2, borderRadius: 999 }]}
          >
            {label}
          </Button>
        ))}
      </Box>

      <Box sx={[softInset, { borderRadius: 4, p: { xs: 1.5, sm: 2 }, minWidth: 0 }]}>
        {tab === 'jobs' && (
          <Section title={`Jobs, W/E ${formatWeekEnding(detail.weekEnding)}`}>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size='small' sx={softTableSx}>
                <TableHead>
                  <TableRow>
                    <TableCell>Job</TableCell>
                    <TableCell>Taken by</TableCell>
                    <TableCell align='right'>Place</TableCell>
                    <TableCell>Reason</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {detail.jobs.map((job, row) => (
                    <TableRow key={`${job.jobKey}-${row}`} sx={job.hidden ? { opacity: 0.6 } : undefined}>
                      <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{job.jobNumber || 'No job #'}</TableCell>
                      <TableCell>
                        {job.hidden ? HIDDEN[job.hidden] : job.taken === null ? '—' : job.name || 'Open'}
                        {job.coveredBy && job.coveredBy !== job.name && (
                          <Box component='span' sx={{ display: 'block', color: 'text.secondary' }}>
                            Pick list: {job.coveredBy}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell align='right'>{job.place ?? '—'}</TableCell>
                      <TableCell>{job.coverReason || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Typography variant='body2' color='text.secondary'>
              Taken by is the sheet&apos;s NAME column. Place is where the pick list row whose Job / status is
              this job sits on the list, named when it differs.
            </Typography>
          </Section>
        )}

        {tab === 'drivers' &&
          (detail.drivers.length ? (
            <Section title='Pick list as it closed'>
              <TableContainer sx={{ overflowX: 'auto' }}>
                <Table size='small' sx={softTableSx}>
                  <TableHead>
                    <TableRow>
                      <TableCell align='right'>Place</TableCell>
                      <TableCell>Driver</TableCell>
                      <TableCell>Call-in</TableCell>
                      <TableCell>Outcome</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.drivers.map((driver) => (
                      <TableRow key={driver.key}>
                        <TableCell align='right'>{driver.place ?? '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{driver.name}</TableCell>
                        <TableCell>{driver.callIn || '—'}</TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>{outcome(driver)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Section>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              No pick list was saved for this week.
            </Typography>
          ))}

        {tab === 'log' &&
          (detail.log.entries.length ? (
            <Section title='What changed, oldest first'>
              <Box component='ol' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 1 }}>
                {log.map((entry) => (
                  <Box component='li' key={`${entry.type}-${entry._id}`}>
                    <Typography variant='body2'>
                      <Box component='span' sx={{ color: 'text.secondary' }}>
                        {formatWhen(entry.seenAt)} ·{' '}
                      </Box>
                      {entry.type === 'job' ? (
                        <>
                          {changeJob(entry) && <strong>{changeJob(entry)} </strong>}
                          {describeCoverJobChange(entry)}
                        </>
                      ) : (
                        <>
                          <strong>{displayName(entry.name)}</strong> {describePickEvent(entry)}
                        </>
                      )}
                    </Typography>
                  </Box>
                ))}
              </Box>
              {detail.log.entries.length > LOG_PAGE && (
                <Button
                  onClick={() => setShowLog((value) => !value)}
                  sx={[softRaisedSmall, softPressSx, { alignSelf: 'center', minHeight: '2.75rem', px: 3, mt: 1 }]}
                >
                  {showLog ? 'Show fewer' : `Show all ${detail.log.entries.length}`}
                </Button>
              )}
              {detail.log.truncated && (
                <Typography variant='body2' color='text.secondary'>
                  Only the first changes are listed; the week has more.
                </Typography>
              )}
            </Section>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              Nothing changed after this week was first saved.
            </Typography>
          ))}
      </Box>

      <Button
        component={Link}
        href={`/admin/cover/jobs?week=${detail.weekEnding}`}
        endIcon={<ChevronRightOutlined />}
        sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', minHeight: '2.75rem', px: 2.5 }]}
      >
        Open in Cover Jobs
      </Button>
    </Box>
  );
}
