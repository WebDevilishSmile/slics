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
import { GYM_STATUSES } from '@/constants';
import SlicTagsField from '../form/SlicTagsField';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '../utility/soft';

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
      variant='panel'
      sx={{
        minHeight: 0,
        alignItems: 'stretch',
        mt: 4,
        p: 2,
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
          onClick={() => location.request()}
          disabled={location.loading}
          sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
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
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={onAdd}
          sx={softContainedSx}
        >
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
        {GYM_STATUSES.map(({ value, label }) => {
          const selected = statuses.includes(value);
          return (
            <Chip
              key={value}
              size='medium'
              label={label}
              clickable
              onClick={() => onToggleStatus(value)}
              aria-pressed={selected}
              sx={softToggleSx}
            />
          );
        })}
      </Box>
    </Paper>
  );
}

export default GymSearchBar;
