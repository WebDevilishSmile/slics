'use client';

import { Chip, Tooltip, Typography } from '@mui/material';
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
