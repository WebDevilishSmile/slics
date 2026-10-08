'use client';

import { Add, MyLocation } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Typography,
} from '@mui/material';
import { PLACE_CATEGORIES } from '@/utils/variables';
import SlicTagsField from '../form/SlicTagsField';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '../utility/soft';
import PlaceCategoryIcon from './PlaceCategoryIcon';

// The filters, as a seamless soft panel (CLAUDE.md "Visual style"): the SLIC
// picker is a pressed-in well, the categories toggle in and out, and Add
// place is the one brand-blue button. `location` is the useGeolocation()
// result owned by PlaceFinder.
function PlaceSearchBar({
  slics,
  selectedSlics,
  onSlicsChange,
  categories,
  onToggleCategory,
  location,
  onAdd,
}) {
  return (
    <Paper
      variant='panel'
      sx={{
        minHeight: 0,
        p: { xs: 2, sm: 3 },
        alignItems: 'stretch',
        gap: 2.5,
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
          gap: 1.5,
        }}
      >
        <Button
          onClick={() => location.request()}
          disabled={location.loading}
          startIcon={
            location.loading ? (
              <CircularProgress size={16} color='inherit' />
            ) : (
              <MyLocation />
            )
          }
          sx={[softRaisedSmall, softPressSx, { px: 2 }]}
        >
          {location.position ? 'Update my location' : 'Near me'}
        </Button>
        <Button
          variant='contained'
          startIcon={<Add />}
          onClick={onAdd}
          sx={softContainedSx}
        >
          Add place
        </Button>
      </Box>

      {location.error && (
        <Alert severity='warning'>{location.error.message}</Alert>
      )}

      <Box>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
          {categories.length === 0
            ? 'Showing every kind of place. Tap to narrow it down.'
            : 'Showing places with any of:'}
        </Typography>
        <Box
          role='group'
          aria-label='Filter by category'
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}
        >
          {PLACE_CATEGORIES.map(({ value, label }) => {
            const selected = categories.includes(value);
            return (
              <Chip
                key={value}
                size='medium'
                icon={<PlaceCategoryIcon category={value} />}
                label={label}
                onClick={() => onToggleCategory(value)}
                aria-pressed={selected}
                sx={softToggleSx}
              />
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}

export default PlaceSearchBar;
