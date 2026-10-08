'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  ChatBubbleOutline,
  Circle,
  Edit,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Collapse,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';
import { softPressSx, softRaisedSmall } from '../utility/soft';
import { GYM_STATUSES } from '@/constants';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { apiRequest } from '@/utils/apiRequest';
import GymComments from './GymComments';
import PlaceLinks from '../utility/PlaceLinks';

function lastVisitedLabel(iso) {
  if (!iso) return 'Not visited yet';
  const visited = dayjs(iso);
  const days = dayjs().startOf('day').diff(visited.startOf('day'), 'day');
  const ago =
    days <= 0 ? 'today' : days === 1 ? 'yesterday' : `${days} days ago`;
  return `Last visited ${visited.format('MMM D, YYYY')} (${ago})`;
}

function formatMiles(miles) {
  return `~${miles < 10 ? miles.toFixed(1) : Math.round(miles)} mi`;
}

// `miles` is the straight-line distance from the driver, or null when there's
// no location yet or the gym has no parking pin.
function GymCard({ gym, miles, slicLabels, onEdit }) {
  const { isRefreshing, refresh } = useCommentRefresh();
  const [showComments, setShowComments] = useState(false);
  const [marking, setMarking] = useState(false);
  const [toast, setToast] = useState({
    open: false,
    severity: 'success',
    message: '',
  });

  const status = GYM_STATUSES.find(({ value }) => value === gym.status);

  const handleMarkVisited = async () => {
    setMarking(true);
    const { error } = await apiRequest(`/api/gyms/${gym._id}/visit`);
    setMarking(false);
    if (error) {
      setToast({ open: true, severity: 'error', message: error });
      return;
    }
    setToast({
      open: true,
      severity: 'success',
      message: `Marked ${gym.name} visited today.`,
    });
    refresh();
  };

  const closeToast = () => setToast((current) => ({ ...current, open: false }));

  return (
    // The seamless soft panel, so PlaceLinks' soft buttons (shared with
    // Whip It In & Out) sit on the surface they're shaded for.
    <Paper
      variant='panel'
      sx={{
        mt: 0,
        minHeight: 0,
        p: 2,
        alignItems: 'stretch',
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
            {gym.name}
          </Typography>
          <Typography color='text.secondary'>{gym.address.street}</Typography>
          <Typography color='text.secondary'>
            {gym.address.city}, {gym.address.state} {gym.address.zip}
          </Typography>
        </Box>
        <Tooltip title='Edit gym'>
          <IconButton
            aria-label={`Edit ${gym.name}`}
            onClick={() => onEdit(gym)}
            disabled={isRefreshing}
            sx={softPressSx}
          >
            <Edit />
          </IconButton>
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {status && (
          <Chip
            icon={<Circle />}
            label={status.label}
            sx={[
              softRaisedSmall,
              { '& .MuiChip-icon': { fontSize: 12, color: `${status.color}.main` } },
            ]}
          />
        )}
        <Chip
          label={gym.open24h ? 'Open 24 hours' : gym.hours || 'Hours not set'}
          sx={[softRaisedSmall, { maxWidth: '100%' }]}
        />
        {miles != null && (
          <Chip
            label={`${formatMiles(miles)} away`}
            sx={[softRaisedSmall, { color: 'primary.main' }]}
          />
        )}
      </Box>

      <PlaceLinks place={gym} />

      {gym.slics.length > 0 && (
        <Box>
          <Typography variant='body2' color='text.secondary' sx={{ mb: 0.5 }}>
            On the way to/from
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {gym.slics.map((numSlic) => (
              <Chip
                key={numSlic}
                label={slicLabels[numSlic] ?? numSlic}
                sx={[softRaisedSmall, { maxWidth: '100%' }]}
              />
            ))}
          </Box>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1,
        }}
      >
        <Typography variant='body2'>{lastVisitedLabel(gym.lastVisited)}</Typography>
        <Button
          size='small'
          onClick={handleMarkVisited}
          disabled={marking || isRefreshing}
          sx={[softRaisedSmall, softPressSx, { px: 2, minHeight: '2.5rem' }]}
        >
          {marking ? 'Saving…' : 'Mark visited'}
        </Button>
      </Box>

      <Button
        onClick={() => setShowComments((open) => !open)}
        startIcon={<ChatBubbleOutline />}
        endIcon={showComments ? <ExpandLess /> : <ExpandMore />}
        aria-expanded={showComments}
        sx={[softRaisedSmall, softPressSx, { alignSelf: 'flex-start', px: 2 }]}
      >
        Comments ({gym.comments.length})
      </Button>
      <Collapse in={showComments} unmountOnExit>
        <GymComments gym={gym} />
      </Collapse>

      <Snackbar open={toast.open} onClose={closeToast}>
        <Alert
          severity={toast.severity}
          variant='filled'
          onClose={closeToast}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default GymCard;
