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
import theme from '@/utils/theme';
import { PLACE_CATEGORIES } from '@/utils/variables';
import SlicTagsField from '../form/SlicTagsField';
import PlaceCategoryIcon from './PlaceCategoryIcon';

// `location` is the useGeolocation() result owned by PlaceFinder.
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
          Add place
        </Button>
      </Box>

      {location.error && (
        <Alert severity='warning'>{location.error.message}</Alert>
      )}

      <Box>
        <Typography variant='body2' color='text.secondary' sx={{ mb: 1 }}>
          {categories.length === 0
            ? 'Showing every kind of place. Tap to narrow it down.'
            : 'Showing places with any of:'}
        </Typography>
        <Box
          role='group'
          aria-label='Filter by category'
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
        >
          {PLACE_CATEGORIES.map(({ value, label }) => {
            const selected = categories.includes(value);
            return (
              <Chip
                key={value}
                size='medium'
                icon={<PlaceCategoryIcon category={value} />}
                label={label}
                color={selected ? 'primary' : 'default'}
                variant={selected ? 'filled' : 'outlined'}
                onClick={() => onToggleCategory(value)}
                aria-pressed={selected}
              />
            );
          })}
        </Box>
      </Box>
    </Paper>
  );
}

export default PlaceSearchBar;
