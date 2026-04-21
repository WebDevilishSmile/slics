'use client';

import {
  Box,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

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
  const handleDayToggle = (_, newDays) => {
    setSelectedDays(newDays);
  };

  const handleTimeToggle = (_, newTime) => {
    if (newTime !== null) setTimeOfDay(newTime);
  };

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        p: { xs: 1.5, md: 2 },
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      {/* Search + Destination */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <TextField
          size='small'
          label='Search job name'
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          fullWidth
        />
        <TextField
          size='small'
          label='Destination'
          value={destinationFilter}
          onChange={(e) => setDestinationFilter(e.target.value)}
          fullWidth
        />
      </Box>

      {/* Days of week */}
      <Box>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ mb: 0.5, display: 'block' }}
        >
          Days
        </Typography>
        <ToggleButtonGroup
          value={selectedDays}
          onChange={handleDayToggle}
          size='small'
          sx={{ flexWrap: 'wrap', gap: 0.5 }}
        >
          {DAYS.map(({ key, label }) => (
            <ToggleButton
              key={key}
              value={key}
              sx={{
                minWidth: { xs: 36, md: 40 },
                px: 1,
                py: 0.5,
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Time of day */}
      <Box>
        <Typography
          variant='caption'
          color='text.secondary'
          sx={{ mb: 0.5, display: 'block' }}
        >
          Time of day
        </Typography>
        <ToggleButtonGroup
          value={timeOfDay}
          exclusive
          onChange={handleTimeToggle}
          size='small'
          sx={{ flexWrap: 'wrap' }}
        >
          {TIME_OPTIONS.map(({ value, label }) => (
            <ToggleButton
              key={value}
              value={value}
              sx={{ px: { xs: 1.5, md: 2 }, fontSize: '0.75rem' }}
            >
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Box>
  );
}

export default BidsFilters;
