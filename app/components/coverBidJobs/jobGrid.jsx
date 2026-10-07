'use client';

import { Chip, Tooltip, Typography } from '@mui/material';
import { DAY_COLORS, DAY_LABELS, formatDayValue } from './dayFormat';

// DataGrid pieces shared by the desktop tables on /bids (bids/BidsTable.jsx)
// and /cover-bid-jobs (coverBidJobs/CoverBidJobsTable.jsx), UI-SUGGESTIONS.md
// #28. The column sets differ; these parts didn't.

export const JOB_GRID_SX = {
  border: 'none',
  '& .MuiDataGrid-cell': { alignItems: 'center', py: 0.5 },
};

// One day's time as a colored chip. `showDay` prefixes the day name, for a
// single "Days & Times" column; per-day columns already have it as a header.
export function DayTimeChip({ day, value, showDay = false }) {
  const time = formatDayValue(value);
  return (
    <Tooltip title={time} arrow>
      <Chip
        label={showDay ? `${DAY_LABELS[day]} ${time}` : time}
        color={DAY_COLORS[day] || 'default'}
        sx={{ fontWeight: 600, fontSize: '0.7rem' }}
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
      <Typography
        variant='body2'
        sx={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: '0.8rem',
        }}
      >
        {value}
      </Typography>
    </Tooltip>
  ),
};
