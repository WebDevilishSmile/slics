'use client';

import { Add, MyLocation } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
} from '@mui/material';
import theme from '@/utils/theme';
import { GYM_STATUSES } from '@/utils/variables';
import SlicTagsField from './SlicTagsField';

// `location` is the useGeolocation() result owned by GymFinder.
function GymSearchBar({
  slics,
  selectedSlics,
  onSlicsChange,
  statuses,
  onToggleStatus,
  location,
  onAdd,
}) {
  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.panel,
        mt: 4,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <SlicTagsField
        slics={slics}
        value={selectedSlics}
        onChange={onSlicsChange}
        label='Coming from / going to'
        placeholder='SLIC number or name'
      />

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Button
          variant={location.position ? 'contained' : 'outlined'}
          onClick={() => location.request()}
          disabled={location.loading}
          startIcon={
            location.loading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <MyLocation />
            )
          }
        >
          {location.position ? 'Update my location' : 'Near me'}
        </Button>
        <Button variant='contained' startIcon={<Add />} onClick={onAdd}>
          Add gym
        </Button>
      </Box>

      {location.error && (
        <Alert severity='warning'>{location.error.message}</Alert>
      )}

      <Box
        role='group'
        aria-label='Filter by status'
        sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
      >
        {GYM_STATUSES.map(({ value, label, color }) => {
          const selected = statuses.includes(value);
          return (
            <Chip
              key={value}
              size='medium'
              label={label}
              color={selected ? color : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => onToggleStatus(value)}
              aria-pressed={selected}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

export default GymSearchBar;
