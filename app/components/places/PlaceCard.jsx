'use client';

import { useState } from 'react';
import {
  ChatBubbleOutline,
  Edit,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import theme from '@/utils/theme';
import { PLACE_CATEGORIES, TRAILER_ACCESS } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import PlaceLinks from '../utility/PlaceLinks';
import PlaceCategoryIcon from './PlaceCategoryIcon';
import PlaceComments from './PlaceComments';

function formatMiles(miles) {
  return `~${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

// `miles` is the straight-line distance from the driver, or null when there's
// no location yet or the place has no parking pin.
function PlaceCard({ place, miles, slicLabels, user, canManage, onEdit }) {
  const { isRefreshing } = useCommentRefresh();
  const [showComments, setShowComments] = useState(false);

  const trailer = TRAILER_ACCESS.find(({ value }) => value === place.trailerAccess);
  const { street, city, state, zip } = place.address;

  return (
    <Paper
      elevation={2}
      sx={{
        width: '100%',
        maxWidth: theme.layout.width.panel,
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography variant='h6' component='h3' sx={{ overflowWrap: 'anywhere' }}>
            {place.name}
          </Typography>
          {street && <Typography color='text.secondary'>{street}</Typography>}
          <Typography color='text.secondary'>
            {city}, {state} {zip}
          </Typography>
        </Box>
        {canManage && (
          <Tooltip title='Edit place'>
            <IconButton
              aria-label={`Edit ${place.name}`}
              onClick={() => onEdit(place)}
              disabled={isRefreshing}
            >
              <Edit />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {PLACE_CATEGORIES.filter(({ value }) =>
          place.categories.includes(value),
        ).map(({ value, label }) => (
          <Chip
            key={value}
            icon={<PlaceCategoryIcon category={value} />}
            label={label}
            color='primary'
            variant='outlined'
          />
        ))}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {trailer && <Chip label={trailer.label} color={trailer.color} />}
        <Chip
          variant='outlined'
          label={place.open24h ? 'Open 24 hours' : place.hours || 'Hours not set'}
          sx={{ maxWidth: '100%' }}
        />
        {miles != null && (
          <Chip
            variant='outlined'
            color='primary'
            label={`${formatMiles(miles)} away`}
          />
        )}
      </Box>

      <PlaceLinks place={place} />

      {place.slics.length > 0 && (
        <Box>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
            On the way to/from
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {place.slics.map((numSlic) => (
              <Chip
                key={numSlic}
                label={slicLabels[numSlic] ?? numSlic}
                sx={{ maxWidth: '100%' }}
              />
            ))}
          </Box>
        </Box>
      )}

      <Typography variant='caption' color='text.secondary'>
        Added by {place.addedByMe ? 'you' : (place.creatorName ?? 'a former driver')}
      </Typography>

      <Divider />

      <Button
        onClick={() => setShowComments((open) => !open)}
        startIcon={<ChatBubbleOutline />}
        endIcon={showComments ? <ExpandLess /> : <ExpandMore />}
        aria-expanded={showComments}
        sx={{ alignSelf: 'flex-start' }}
      >
        Comments ({place.commentCount})
      </Button>
      <Collapse in={showComments} unmountOnExit>
        <PlaceComments place={place} user={user} />
      </Collapse>
    </Paper>
  );
}

export default PlaceCard;
