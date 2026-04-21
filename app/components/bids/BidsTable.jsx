'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Chip,
  Stack,
  TablePagination,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import BidsFilters from './BidsFilters';
import BidsJobCard from './BidsJobCard';

const DAY_COLORS = {
  sun: 'warning',
  mon: 'primary',
  tue: 'secondary',
  wed: 'success',
  thu: 'info',
  fri: 'error',
  sat: 'warning',
};

const DAY_LABELS = {
  sun: 'Sun',
  mon: 'Mon',
  tue: 'Tue',
  wed: 'Wed',
  thu: 'Thu',
  fri: 'Fri',
  sat: 'Sat',
};

function formatTime(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':');
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

const DESKTOP_COLUMNS = [
  {
    field: 'job_name',
    headerName: 'Job Name',
    width: 120,
    sortable: true,
  },
  {
    field: 'bid_destination',
    headerName: 'Destination',
    width: 130,
    sortable: true,
  },
  {
    field: 'schedule',
    headerName: 'Days & Times',
    width: 340,
    sortable: false,
    renderCell: ({ value }) => {
      const activeDays = Object.entries(value || {}).filter(([, t]) => t !== null);
      return (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 0.5 }}>
          {activeDays.map(([day, time]) => (
            <Tooltip key={day} title={formatTime(time)} arrow>
              <Chip
                label={`${DAY_LABELS[day]} ${formatTime(time)}`}
                size='small'
                color={DAY_COLORS[day] || 'default'}
                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
              />
            </Tooltip>
          ))}
        </Box>
      );
    },
  },
  {
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
  },
];

const CARDS_PER_PAGE = 20;

function applyFilters(jobs, { search, selectedDays, timeOfDay, destinationFilter }) {
  return jobs.filter((job) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !job.job_name?.toLowerCase().includes(q) &&
        !job.bid_destination?.toLowerCase().includes(q)
      )
        return false;
    }
    if (destinationFilter) {
      if (!job.bid_destination?.toLowerCase().includes(destinationFilter.toLowerCase()))
        return false;
    }
    if (selectedDays.length > 0) {
      for (const day of selectedDays) {
        if (!job.schedule?.[day]) return false;
      }
    }
    if (timeOfDay !== 'all') {
      const times = Object.values(job.schedule || {}).filter(Boolean);
      const inRange = times.some((t) => {
        const hour = parseInt(t.split(':')[0], 10);
        if (timeOfDay === 'morning') return hour < 12;
        if (timeOfDay === 'afternoon') return hour >= 12 && hour < 18;
        if (timeOfDay === 'evening') return hour >= 18;
        return false;
      });
      if (!inRange) return false;
    }
    return true;
  });
}

function BidsTable({ jobs }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const [search, setSearch] = useState('');
  const [selectedDays, setSelectedDays] = useState([]);
  const [timeOfDay, setTimeOfDay] = useState('all');
  const [destinationFilter, setDestinationFilter] = useState('');
  const [filteredJobs, setFilteredJobs] = useState(jobs);
  const [page, setPage] = useState(0);

  useEffect(() => {
    setFilteredJobs(applyFilters(jobs, { search, selectedDays, timeOfDay, destinationFilter }));
    setPage(0);
  }, [jobs, search, selectedDays, timeOfDay, destinationFilter]);

  const paginatedJobs = filteredJobs.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  return (
    <Box sx={{ width: '100%' }}>
      <BidsFilters
        search={search}
        setSearch={setSearch}
        selectedDays={selectedDays}
        setSelectedDays={setSelectedDays}
        timeOfDay={timeOfDay}
        setTimeOfDay={setTimeOfDay}
        destinationFilter={destinationFilter}
        setDestinationFilter={setDestinationFilter}
      />

      {/* Result count */}
      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ px: 2, py: 1, display: 'block' }}
      >
        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
      </Typography>

      {isDesktop ? (
        /* Desktop: DataGrid */
        <Box sx={{ px: 1 }}>
          <DataGrid
            rows={filteredJobs}
            columns={DESKTOP_COLUMNS}
            getRowId={(row) => row._id}
            pageSizeOptions={[25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 25 } },
            }}
            autoHeight
            getRowHeight={() => 'auto'}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { alignItems: 'center', py: 0.5 },
            }}
          />
        </Box>
      ) : (
        /* Mobile: Card list */
        <Box sx={{ px: 1.5, pb: 2 }}>
          <Stack spacing={1.5}>
            {paginatedJobs.map((job) => (
              <BidsJobCard key={job._id} job={job} />
            ))}
          </Stack>

          {filteredJobs.length === 0 && (
            <Typography
              color='text.secondary'
              textAlign='center'
              sx={{ py: 4 }}
            >
              No jobs match the current filters.
            </Typography>
          )}

          <TablePagination
            component='div'
            count={filteredJobs.length}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowsPerPage={CARDS_PER_PAGE}
            rowsPerPageOptions={[]}
            sx={{ mt: 1 }}
          />
        </Box>
      )}
    </Box>
  );
}

export default BidsTable;
