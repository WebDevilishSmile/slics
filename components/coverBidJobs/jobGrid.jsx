'use client';

import { Box, Chip, Tooltip, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PlaylistAddCheckIcon from '@mui/icons-material/PlaylistAddCheck';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { softRaised } from '@/components/utility/soft';
import { DAY_COLORS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';

// DataGrid pieces for the desktop job table on /covers
// (coverBidJobs/CoverBidJobsTable.jsx), UI-SUGGESTIONS.md #28. They were
// shared with /bids until that page was deleted on 2026-10-10.

// The grid sits straight on a soft card: no borders, rules or separators,
// headers in brand blue like softTableSx.
export const JOB_GRID_SX = {
  border: 'none',
  backgroundColor: 'transparent',
  '--DataGrid-containerBackground': 'transparent',
  '--DataGrid-rowBorderColor': 'transparent',
  '& .MuiDataGrid-cell': { alignItems: 'center', py: 0.5 },
  '& .MuiDataGrid-columnSeparator': { display: 'none' },
  '& .MuiDataGrid-columnHeaders, & .MuiDataGrid-footerContainer': {
    borderColor: 'transparent',
  },
  '& .MuiDataGrid-columnHeaderTitle': {
    color: 'primary.main',
    fontWeight: 600,
  },
};

// The card the desktop grid sits on.
export const jobGridCardSx = [softRaised, { borderRadius: 3, p: 1 }];

// The sticky filter bar above either list: a soft raised card that stays up
// while the jobs scroll under it.
export const filterBarSx = [
  softRaised,
  {
    position: 'sticky',
    top: 0,
    zIndex: 'stickyBar',
    borderRadius: 3,
    p: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
];

// A picked job (isPicked, lib/coverBidJobRow.js), grayed out but still
// clickable, on /covers and /admin/cover/jobs. The day chips lose
// their colors too, so the whole job reads as taken.
export const pickedSx = { opacity: 0.55, filter: 'grayscale(1)' };

// A job an admin hid from drivers (docs/COVER-JOB-HIDING.md), on the admin
// pages only: drivers never receive it. Dimmed without the gray, so it reads
// apart from picked.
export const hiddenSx = { opacity: 0.55 };

function JobLabel({ icon: Icon, children, sx }) {
  return (
    <Box
      component='span'
      sx={[
        {
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          typography: 'caption',
          fontWeight: 600,
          color: 'text.secondary',
          whiteSpace: 'nowrap',
        },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      <Icon sx={{ fontSize: '1rem' }} />
      {children}
    </Box>
  );
}

// The words that go with the gray, so "picked" isn't told by color alone.
export function PickedLabel({ sx }) {
  return (
    <JobLabel icon={CheckCircleOutlineIcon} sx={sx}>
      Picked
    </JobLabel>
  );
}

// The words that go with the dimming on a hidden job.
export function HiddenLabel({ sx }) {
  return (
    <JobLabel icon={VisibilityOffIcon} sx={sx}>
      Hidden
    </JobLabel>
  );
}

// Admins: how many drivers' cover lists hold a still-open job, and on how
// many it's the first choice (docs/COVER-BIDDING.md, stage 2;
// hooks/useCoverLists.js). Nothing when it's on none.
export function WantedLabel({ wanted, sx }) {
  if (!wanted?.lists) return null;
  return (
    <JobLabel icon={PlaylistAddCheckIcon} sx={[{ color: 'primary.main' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      On {wanted.lists} list{wanted.lists === 1 ? '' : 's'}
      {wanted.first ? ` · 1st on ${wanted.first}` : ''}
    </JobLabel>
  );
}

// One day's time as a colored chip. `showDay` prefixes the day name, for a
// single "Days & Times" column; per-day columns already have it as a header.
export function DayTimeChip({ day, value, showDay = false }) {
  const time = formatDayValue(value);
  return (
    <Tooltip title={time} arrow>
      <Chip
        label={showDay ? `${DAY_LABELS[day]} ${time}` : time}
        color={DAY_COLORS[day] || 'default'}
        sx={{ typography: 'caption', fontWeight: 600 }}
      />
    </Tooltip>
  );
}

export const descriptionColumn = {
  field: 'description',
  headerName: 'Description',
  flex: 1,
  sortable: false,
  renderCell: ({ value }) => (
    <Tooltip title={value} arrow placement='top'>
      <Typography variant='caption' component='p' noWrap>
        {value}
      </Typography>
    </Tooltip>
  ),
};
