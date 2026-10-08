'use client';

import { useState } from 'react';
import {
  AltRouteOutlined,
  ChatBubbleOutline,
  EditOutlined,
  ExpandLess,
  ExpandMore,
  LocalShippingOutlined,
  NearMeOutlined,
  PlaceOutlined,
  ScheduleOutlined,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Tooltip,
  Typography,
} from '@mui/material';
import { PLACE_CATEGORIES, TRAILER_ACCESS } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import PlaceLinks from '../utility/PlaceLinks';
import {
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '../utility/soft';
import PlaceCategoryIcon from './PlaceCategoryIcon';
import PlaceComments from './PlaceComments';

function formatMiles(miles) {
  return `~${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

// One line in the card's facts well: a brand-blue icon (or a status color,
// for trailer access) beside its text.
function Fact({ icon, iconColor = 'primary.main', children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ color: iconColor, display: 'flex', flexShrink: 0 }}>{icon}</Box>
      <Box sx={{ minWidth: 0, overflowWrap: 'anywhere' }}>{children}</Box>
    </Box>
  );
}

const TRAILER_ICON_COLOR = {
  success: 'success.main',
  warning: 'warning.main',
  error: 'error.main',
  default: 'text.secondary',
};

// A place, laid out like the SLIC lookup card on /home in the soft style
// (CLAUDE.md "Visual style"): a seamless panel with the name, category pills,
// the facts in a pressed-in well, the map button as the one brand-blue
// element, and the comments behind a raised tile. `miles` is the
// straight-line distance from the driver, or null when there's no location
// yet or the place has no parking pin. `index` staggers the entry fade.
function PlaceCard({ place, miles, slicLabels, user, canManage, onEdit, index = 0 }) {
  const { isRefreshing } = useCommentRefresh();
  const [showComments, setShowComments] = useState(false);

  const trailer = TRAILER_ACCESS.find(({ value }) => value === place.trailerAccess);
  const { street, city, state, zip } = place.address;

  return (
    <Paper
      variant='panel'
      className='enter'
      style={{ '--i': index }}
      sx={{
        mt: 0,
        minHeight: 0,
        p: { xs: 2, sm: 3 },
        alignItems: 'stretch',
        gap: 2,
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
          <Typography
            variant='h6'
            component='h3'
            sx={{ fontWeight: 700, overflowWrap: 'anywhere' }}
          >
            {place.name}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Added by {place.addedByMe ? 'you' : (place.creatorName ?? 'a former driver')}
          </Typography>
        </Box>
        {canManage && (
          <Tooltip title='Edit place'>
            <IconButton
              aria-label={`Edit ${place.name}`}
              onClick={() => onEdit(place)}
              disabled={isRefreshing}
              sx={[softPressSx, { width: '3rem', height: '3rem', mr: -1, mt: -0.5 }]}
            >
              <EditOutlined />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {PLACE_CATEGORIES.filter(({ value }) =>
          place.categories.includes(value),
        ).map(({ value, label }) => (
          <Chip
            key={value}
            icon={<PlaceCategoryIcon category={value} />}
            label={label}
            sx={[
              softRaisedSmall,
              (theme) => ({
                color: theme.vars.palette.primary.main,
                fontWeight: 600,
                '& .MuiChip-icon': { color: 'inherit' },
              }),
            ]}
          />
        ))}
      </Box>

      <Box
        sx={[
          softInset,
          {
            borderRadius: 4,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
          },
        ]}
      >
        <Fact icon={<PlaceOutlined />}>
          {street && <Typography>{street}</Typography>}
          <Typography>
            {city}, {state} {zip}
          </Typography>
        </Fact>
        <Fact icon={<ScheduleOutlined />}>
          <Typography>
            {place.open24h ? 'Open 24 hours' : place.hours || 'Hours not set'}
          </Typography>
        </Fact>
        {trailer && (
          <Fact
            icon={<LocalShippingOutlined />}
            iconColor={TRAILER_ICON_COLOR[trailer.color] ?? 'text.secondary'}
          >
            <Typography>{trailer.label}</Typography>
          </Fact>
        )}
        {miles != null && (
          <Fact icon={<NearMeOutlined />}>
            <Typography>{formatMiles(miles)} away</Typography>
          </Fact>
        )}
        {place.slics.length > 0 && (
          <Fact icon={<AltRouteOutlined />}>
            <Typography variant='body2' color='text.secondary'>
              On the way to/from
            </Typography>
            {place.slics.map((numSlic) => (
              <Typography key={numSlic}>{slicLabels[numSlic] ?? numSlic}</Typography>
            ))}
          </Fact>
        )}
      </Box>

      <PlaceLinks place={place} />

      {/* A raised tile that stays pressed in while the thread is open. */}
      <Button
        fullWidth
        onClick={() => setShowComments((open) => !open)}
        startIcon={<ChatBubbleOutline />}
        endIcon={showComments ? <ExpandLess /> : <ExpandMore />}
        aria-expanded={showComments}
        sx={[
          softRaised,
          softPressSx,
          (theme) => ({
            minHeight: '3rem',
            '&[aria-expanded="true"]': softInset(theme),
          }),
        ]}
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
