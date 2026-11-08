'use client';

import { Fragment, useMemo, useState } from 'react';
import {
  ArrowDownwardOutlined,
  ArrowUpwardOutlined,
  ExpandLessOutlined,
  ExpandMoreOutlined,
} from '@mui/icons-material';
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
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';

import { shortDate } from '@/components/admin/hub/format';
import { softInputSx, softPressSx, softRaisedSmall, softTableSx } from '@/components/utility/soft';

const COLUMNS = [
  { key: 'name', label: 'Driver', value: (driver) => driver.name, text: true },
  { key: 'weeks', label: 'Weeks', value: (driver) => driver.weeks },
  { key: 'coverWeeks', label: 'Cover', value: (driver) => driver.coverWeeks },
  { key: 'onCallWeeks', label: 'On call', value: (driver) => driver.onCallWeeks },
  { key: 'covering', label: 'Covered', value: (driver) => driver.covering },
  { key: 'coverNoJob', label: 'No job', value: (driver) => driver.coverNoJob },
  { key: 'out', label: 'Out', value: (driver) => driver.out },
  { key: 'avgPlace', label: 'Avg place', value: (driver) => driver.avgPlace },
  { key: 'moved', label: 'Moved', value: (driver) => driver.moved },
];
const PAGE = 25;

const leaveText = (leaves) =>
  Object.entries(leaves)
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => `${count} ${type}`)
    .join(', ');

// Up the list (a smaller number) or down, by icon and word as well as color.
function Moved({ driver }) {
  if (!driver.moved) return <>—</>;
  const up = driver.moved > 0;
  const Icon = up ? ArrowUpwardOutlined : ArrowDownwardOutlined;
  return (
    <Box
      component='span'
      sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: up ? 'success.main' : 'warning.main' }}
      title={`${driver.firstPlace} → ${driver.lastPlace}`}
    >
      <Icon fontSize='small' aria-hidden />
      <span>
        {Math.abs(driver.moved)} {up ? 'up' : 'down'}
      </span>
    </Box>
  );
}

// Every driver on the pick lists across the weeks (driverTrends,
// lib/coverHistory.js): cover or on call, how often they covered a job or had
// none, how often they were out and why, and how their place moved. A row
// opens to their weeks.
export default function DriverTrendsTable({ drivers }) {
  // Pick list order by default: the earliest average place first.
  const [sort, setSort] = useState({ key: 'avgPlace', direction: 'asc' });
  const [search, setSearch] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [open, setOpen] = useState(null);

  const rows = useMemo(() => {
    const query = search.trim().toLowerCase();
    const column = COLUMNS.find((entry) => entry.key === sort.key);
    return drivers
      .filter((driver) => !query || driver.name.toLowerCase().includes(query))
      .sort((a, b) => {
        const x = column.value(a);
        const y = column.value(b);
        if (x === null) return 1;
        if (y === null) return -1;
        const order = column.text ? String(x).localeCompare(String(y)) : x - y;
        return sort.direction === 'asc' ? order : -order;
      });
  }, [drivers, search, sort]);
  const shown = showAll || search ? rows : rows.slice(0, PAGE);

  const sortBy = (key) =>
    setSort((current) => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc',
    }));

  if (drivers.length === 0) {
    return (
      <Typography variant='body2' color='text.secondary'>
        No pick lists saved in these weeks.
      </Typography>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        placeholder='Find a driver'
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        sx={[softInputSx, { maxWidth: (theme) => theme.layout.width.field }]}
        slotProps={{ htmlInput: { 'aria-label': 'Find a driver' } }}
      />
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size='small' sx={softTableSx} aria-label='Drivers across the weeks'>
          <TableHead>
            <TableRow>
              <TableCell padding='checkbox' />
              {COLUMNS.map((column) => {
                const active = sort.key === column.key;
                return (
                  <TableCell
                    key={column.key}
                    align={column.text ? 'left' : 'right'}
                    sortDirection={active ? sort.direction : false}
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    <TableSortLabel
                      active={active}
                      direction={active ? sort.direction : 'desc'}
                      onClick={() => sortBy(column.key)}
                    >
                      {column.label}
                    </TableSortLabel>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((driver) => {
              const expanded = open === driver.key;
              return (
                <Fragment key={driver.key}>
                  <TableRow>
                    <TableCell padding='checkbox'>
                      <IconButton
                        aria-label={`${expanded ? 'Hide' : 'Show'} ${driver.name}'s weeks`}
                        aria-expanded={expanded}
                        onClick={() => setOpen(expanded ? null : driver.key)}
                        sx={softPressSx}
                      >
                        {expanded ? <ExpandLessOutlined /> : <ExpandMoreOutlined />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{driver.name}</TableCell>
                    <TableCell align='right'>{driver.weeks}</TableCell>
                    <TableCell align='right'>{driver.coverWeeks}</TableCell>
                    <TableCell align='right'>{driver.onCallWeeks}</TableCell>
                    <TableCell align='right'>{driver.covering}</TableCell>
                    <TableCell align='right'>{driver.coverNoJob || '—'}</TableCell>
                    <TableCell align='right' title={leaveText(driver.leaves) || undefined}>
                      {driver.out || '—'}
                    </TableCell>
                    <TableCell align='right'>{driver.avgPlace ?? '—'}</TableCell>
                    <TableCell align='right' sx={{ whiteSpace: 'nowrap' }}>
                      <Moved driver={driver} />
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow>
                      <TableCell />
                      <TableCell colSpan={COLUMNS.length}>
                        <Box sx={{ display: 'grid', gap: 0.5, pb: 1 }}>
                          <Typography variant='body2' color='text.secondary'>
                            Places: {driver.places.map((entry) => `${entry.place} (${shortDate(entry.weekEnding)})`).join(' · ')}
                          </Typography>
                          <Typography variant='body2' color='text.secondary'>
                            Covered:{' '}
                            {driver.jobs.length
                              ? driver.jobs.map((job) => `${job.jobNumber} (${shortDate(job.weekEnding)})`).join(' · ')
                              : 'none'}
                          </Typography>
                          {driver.out > 0 && (
                            <Typography variant='body2' color='text.secondary'>
                              Out: {leaveText(driver.leaves)}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!search && rows.length > PAGE && (
        <Button
          onClick={() => setShowAll((value) => !value)}
          sx={[softRaisedSmall, softPressSx, { alignSelf: 'center', minHeight: '2.75rem', px: 3 }]}
        >
          {showAll ? 'Show fewer' : `Show all ${rows.length}`}
        </Button>
      )}
      <Typography variant='body2' color='text.secondary'>
        Moved compares a driver&apos;s place in their first and latest week here: up is a smaller number,
        closer to first pick.
      </Typography>
    </Box>
  );
}
