'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ErrorOutline, MoreHoriz, SearchOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import {
  softInputSx,
  softPressSx,
  softRaisedSmall,
  softTableSx,
  softToggleSx,
} from '@/components/utility/soft';
import DeleteDriverDialog from './DeleteDriverDialog';
import DriverDetailsDialog from './DriverDetailsDialog';
import LinkRosterDialog from './LinkRosterDialog';
import { coverLine, formatSeniority } from './seniority';

const smallButtonSx = [softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }];

const FILTERS = [
  { value: 'suggested', label: 'Suggested matches', test: (driver) => driver.suggestion },
  { value: 'noDetails', label: 'No roster details', test: (driver) => !driver.roster && !driver.suggestion },
  { value: 'cover', label: 'Cover / on call', test: (driver) => driver.cover },
  // A linked row whose date doesn't fit the sheet's rank: a wrong link or a
  // wrong date (lib/driverRoster.js). It sorts by its date and moves no one.
  { value: 'offRank', label: "Date doesn't fit rank", test: (driver) => driver.dateFitsRank === false },
];

// The line under a sheet driver's name: their job or their cover spot.
const driverLine = (driver) => (driver.job ? `Job ${driver.job}` : driver.cover ? coverLine(driver.cover) : '');

function OptionsMenu({ label, items }) {
  const [anchor, setAnchor] = useState(null);
  return (
    <>
      <IconButton
        size='small'
        onClick={(event) => setAnchor(event.currentTarget)}
        aria-label={label}
        sx={[softPressSx, { width: '2.75rem', height: '2.75rem' }]}
      >
        <MoreHoriz />
      </IconButton>
      <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
        {items.map(({ label: itemLabel, onClick }) => (
          <MenuItem
            key={itemLabel}
            onClick={() => {
              setAnchor(null);
              onClick();
            }}
            sx={{ minHeight: '3rem' }}
          >
            {itemLabel}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

/**
 * /admin/drivers: the on-call sheet's drivers with the roster merged in
 * (lib/driverRoster.js), by seniority date, then the roster rows that are on
 * no sheet. The sheet leads: names, ranks, jobs and cover spots are its. The
 * roster adds employee IDs, seniority dates and phones. Every change reloads
 * the merge from the server.
 */
export default function DriversView({ drivers, rosterOnly, counts }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [busyKey, setBusyKey] = useState(null);
  const [error, setError] = useState('');

  const refresh = () => startRefresh(() => router.refresh());
  const closeDialog = () => setDialog(null);
  const saved = () => {
    setDialog(null);
    refresh();
  };

  // Link (`method: 'PUT'`) or "not the same driver" (`'DELETE'`).
  const changeLink = async (driver, rosterId, method) => {
    setBusyKey(driver.key);
    setError('');
    const { error } = await apiRequest(`/api/drivers/${rosterId}/link`, {
      method,
      body: { name: driver.name },
    });
    setBusyKey(null);
    if (error) return setError(error);
    refresh();
  };

  const search = query.trim().toLowerCase();
  const matchesSearch = (...values) =>
    !search || values.some((value) => String(value ?? '').toLowerCase().includes(search));

  const test = FILTERS.find((option) => option.value === filter)?.test ?? (() => true);
  const shown = drivers.filter(
    (driver) =>
      test(driver) &&
      matchesSearch(driver.name, driver.job, driver.roster?.name, driver.roster?.employeeId),
  );
  const shownRosterOnly = rosterOnly.filter((row) => matchesSearch(row.name, row.employeeId));

  const busy = (driver) => busyKey === driver.key || refreshing;

  return (
    <Paper
      variant='panel'
      sx={{
        maxWidth: theme.layout.width.wide,
        minHeight: 0,
        alignItems: 'stretch',
        gap: 2.5,
        px: { xs: 1.5, sm: 3 },
      }}
    >
      <Typography variant='body2' color='text.secondary'>
        Names, seniority ranks, jobs and cover spots come from the on-call
        sheet. Employee IDs, seniority dates and phones come from the roster.
      </Typography>

      <TextField
        placeholder='Search drivers'
        fullWidth
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={softInputSx}
        slotProps={{
          htmlInput: { 'aria-label': 'Search drivers' },
          input: {
            startAdornment: (
              <InputAdornment position='start'>
                <SearchOutlined />
              </InputAdornment>
            ),
          },
        }}
      />

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {FILTERS.map(({ value, label }) => (
          <Chip
            key={value}
            size='medium'
            label={`${label} (${counts[value]})`}
            clickable
            aria-pressed={filter === value}
            sx={softToggleSx}
            onClick={() => setFilter(filter === value ? null : value)}
          />
        ))}
      </Box>

      {error && <Alert severity='error'>{error}</Alert>}

      <Typography variant='caption' color='text.secondary'>
        {shown.length} of {drivers.length} drivers on the sheet
      </Typography>

      {/* Scrolls sideways rather than bursting the panel on a narrow phone. */}
      <Box sx={{ overflowX: 'auto' }}>
        <Table size='small' sx={softTableSx} aria-label='Drivers on the sheet'>
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: '3rem' }}>#</TableCell>
              <TableCell>Driver</TableCell>
              <TableCell sx={{ width: '9rem', whiteSpace: 'nowrap' }}>Seniority date</TableCell>
              <TableCell sx={{ width: '3.5rem' }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {shown.map((driver) => (
              <TableRow key={driver.key}>
                <TableCell>{driver.rank ?? ''}</TableCell>
                <TableCell>
                  <Box component='span' sx={{ display: 'block', fontWeight: 600 }}>
                    {driver.name}
                  </Box>
                  <Box component='span' sx={{ display: 'block', color: 'text.secondary', typography: 'caption' }}>
                    {driverLine(driver)}
                    {!driver.roster && !driver.suggestion && ' · No roster details'}
                  </Box>
                  {driver.suggestion && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Typography variant='caption' sx={{ flexBasis: '100%' }}>
                        Roster has <strong>{driver.suggestion.roster.name}</strong>,{' '}
                        {formatSeniority(driver.suggestion.roster.seniorityDate)}
                        {driver.suggestion.fitsRank === true && ' (fits the rank)'}
                        {driver.suggestion.fitsRank === false && " (doesn't fit the rank)"}
                      </Typography>
                      <Button
                        size='small'
                        disabled={busy(driver)}
                        onClick={() => changeLink(driver, driver.suggestion.roster._id, 'PUT')}
                        sx={smallButtonSx}
                      >
                        Same driver
                      </Button>
                      <Button
                        size='small'
                        disabled={busy(driver)}
                        onClick={() => changeLink(driver, driver.suggestion.roster._id, 'DELETE')}
                        sx={smallButtonSx}
                      >
                        Not the same
                      </Button>
                    </Box>
                  )}
                </TableCell>
                <TableCell sx={{ whiteSpace: 'nowrap' }}>
                  {driver.roster ? formatSeniority(driver.roster.seniorityDate) : '—'}
                  {driver.dateFitsRank === false && (
                    <Box
                      component='span'
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', typography: 'caption' }}
                    >
                      <ErrorOutline sx={{ fontSize: '1rem', color: 'warning.main' }} />
                      Doesn&apos;t fit #{driver.rank}
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  <OptionsMenu
                    label={`Options for ${driver.name}`}
                    items={
                      driver.roster
                        ? [
                            {
                              label: 'Edit details',
                              onClick: () => setDialog({ kind: 'details', driver: driver.roster, sheetName: driver.name }),
                            },
                            {
                              label: 'Not this roster row',
                              onClick: () => changeLink(driver, driver.roster._id, 'DELETE'),
                            },
                          ]
                        : [
                            {
                              label: 'Add details',
                              onClick: () => setDialog({ kind: 'details', sheetName: driver.name }),
                            },
                            {
                              label: 'Link to a roster row…',
                              onClick: () => setDialog({ kind: 'link', driver }),
                            },
                          ]
                    }
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>

      <Box component='section' aria-labelledby='roster-only' sx={{ mt: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
          <Typography id='roster-only' variant='subtitle1' component='h2' sx={{ fontWeight: 600 }}>
            Not on the sheet ({rosterOnly.length})
          </Typography>
          <Button onClick={() => setDialog({ kind: 'details' })} sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.75rem' }]}>
            Add to roster
          </Button>
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ mt: 1, mb: 1.5 }}>
          Roster rows that aren&apos;t on the Jobs tab or a cover tab from the
          last 8 weeks: drivers who left, are on leave, or are spelled
          differently. Delete the ones who left.
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size='small' sx={softTableSx} aria-labelledby='roster-only'>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell sx={{ width: '9rem', whiteSpace: 'nowrap' }}>Seniority date</TableCell>
                <TableCell sx={{ width: '3.5rem' }} />
              </TableRow>
            </TableHead>
            <TableBody>
              {shownRosterOnly.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>
                    <Box component='span' sx={{ display: 'block' }}>
                      {row.name}
                    </Box>
                    {row.linkedTo && (
                      <Box component='span' sx={{ display: 'block', color: 'text.secondary', typography: 'caption' }}>
                        Linked to {row.linkedTo}, not on the sheet now
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatSeniority(row.seniorityDate)}</TableCell>
                  <TableCell>
                    <OptionsMenu
                      label={`Options for ${row.name}`}
                      items={[
                        { label: 'Edit details', onClick: () => setDialog({ kind: 'details', driver: row, editName: true }) },
                        { label: 'Delete', onClick: () => setDialog({ kind: 'delete', driver: row }) },
                      ]}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      {dialog?.kind === 'details' && (
        <DriverDetailsDialog
          driver={dialog.driver}
          sheetName={dialog.sheetName}
          editName={dialog.editName}
          onClose={closeDialog}
          onSaved={saved}
        />
      )}
      {dialog?.kind === 'link' && (
        <LinkRosterDialog
          driver={dialog.driver}
          rosterOnly={rosterOnly}
          onClose={closeDialog}
          onSaved={saved}
        />
      )}
      {dialog?.kind === 'delete' && (
        <DeleteDriverDialog
          openDialog
          setOpenDialog={(open) => !open && closeDialog()}
          driver={dialog.driver}
        />
      )}
    </Paper>
  );
}
