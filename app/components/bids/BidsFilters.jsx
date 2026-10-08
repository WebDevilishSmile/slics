'use client';

import { Box, Chip, TextField, Typography } from '@mui/material';

import { filterBarSx } from '../coverBidJobs/jobGrid';
import { softInputSx, softToggleSx } from '../utility/soft';

const DAYS = [
  { key: 'sun', label: 'Su' },
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'Tu' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'Th' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'Sa' },
];

const TIME_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
];

// Soft toggle chips (utility/soft.js): raised when off, pressed in when on.
// Days are any-of; the time of day is one-of, so one chip is always on.
function BidsFilters({
  search,
  setSearch,
  selectedDays,
  setSelectedDays,
  timeOfDay,
  setTimeOfDay,
  destinationFilter,
  setDestinationFilter,
}) {
  const toggleDay = (day) =>
    setSelectedDays((days) =>
      days.includes(day) ? days.filter((d) => d !== day) : [...days, day],
    );

  return (
    <Box sx={filterBarSx}>
      {/* Search + Destination */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
        }}
      >
        <TextField
          placeholder='Search job name'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
          sx={softInputSx}
          slotProps={{ htmlInput: { 'aria-label': 'Search job name' } }}
        />
        <TextField
          placeholder='Destination'
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          fullWidth
          sx={softInputSx}
          slotProps={{ htmlInput: { 'aria-label': 'Destination' } }}
        />
      </Box>

      {/* Days of week */}
      <Box role='group' aria-labelledby='bids-days-label'>
        <Typography
          id='bids-days-label'
          variant='caption'
          color='text.secondary'
          sx={{ mb: 1, display: 'block' }}
        >
          Days
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {DAYS.map(({ key, label }) => (
            <Chip
              key={key}
              size='medium'
              label={label}
              clickable
              aria-pressed={selectedDays.includes(key)}
              onClick={() => toggleDay(key)}
              sx={[softToggleSx, { minWidth: 44, fontWeight: 600 }]}
            />
          ))}
        </Box>
      </Box>

      {/* Time of day */}
      <Box role='group' aria-labelledby='bids-time-label'>
        <Typography
          id='bids-time-label'
          variant='caption'
          color='text.secondary'
          sx={{ mb: 1, display: 'block' }}
        >
          Time of day
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {TIME_OPTIONS.map(({ value, label }) => (
            <Chip
              key={value}
              size='medium'
              label={label}
              clickable
              aria-pressed={timeOfDay === value}
              onClick={() => setTimeOfDay(value)}
              sx={softToggleSx}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}

export default BidsFilters;
