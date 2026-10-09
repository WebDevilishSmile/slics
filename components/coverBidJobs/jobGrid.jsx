'use client';

import { Box, Chip, Tooltip, Typography } from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { softRaised } from '@/components/utility/soft';
import { DAY_COLORS, DAY_LABELS, formatDayValue } from '@/lib/dayFormat';

// DataGrid pieces shared by the desktop tables on /bids (bids/BidsTable.jsx)
// and /cover-bid-jobs (coverBidJobs/CoverBidJobsTable.jsx), UI-SUGGESTIONS.md
// #28. The column sets differ; these parts didn't.

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
// clickable, on /cover-bid-jobs and /admin/cover/jobs. The day chips lose
// their colors too, so the whole job reads as taken.
export const pickedSx = { opacity: 0.55, filter: 'grayscale(1)' };

// The words that go with the gray, so "picked" isn't told by color alone.
export function PickedLabel({ sx }) {
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
      <CheckCircleOutlineIcon sx={{ fontSize: '1rem' }} />
      Picked
    </Box>
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
