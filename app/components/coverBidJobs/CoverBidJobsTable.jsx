'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  Box,
  Chip,
  MenuItem,
  Paper,
  Stack,
  TablePagination,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CoverBidJobCard from './CoverBidJobCard';
import CoverBidJobDetailDialog from './CoverBidJobDetailDialog';
import {
  DAY_FIELDS,
  DAY_LABELS,
  DAY_COLORS,
  formatDayValue,
} from './dayFormat';
import { ELEVATION } from '@/utils/variables';

const DAY_COLUMNS = DAY_FIELDS.map((day) => ({
  field: day,
  headerName: DAY_LABELS[day],
  width: 90,
  sortable: false,
  renderCell: ({ value }) =>
    value ? (
      <Tooltip title={formatDayValue(value)} arrow>
        <Chip
          label={formatDayValue(value)}
          size='small'
          color={DAY_COLORS[day] || 'default'}
          sx={{ fontWeight: 600, fontSize: '0.7rem' }}
        />
      </Tooltip>
    ) : null,
}));

const DESKTOP_COLUMNS = [
  { field: 'jobNumber', headerName: 'Job #', width: 100, sortable: true },
  ...DAY_COLUMNS,
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

const CARDS_PER_PAGE = 50;

function CoverBidJobsTable({ jobs }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const weeks = useMemo(
    () => [...new Set(jobs.map((job) => job.weekEnding))],
    [jobs],
  );

  const [selectedWeek, setSelectedWeek] = useState(weeks[0] ?? null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  const weekJobs = jobs.filter((job) => job.weekEnding === selectedWeek);

  const filteredJobs = search
    ? weekJobs.filter((job) => {
        const q = search.toLowerCase();
        return (
          job.jobNumber?.toLowerCase().includes(q) ||
          job.description?.toLowerCase().includes(q)
        );
      })
    : weekJobs;

  const paginatedJobs = filteredJobs.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE,
  );

  if (jobs.length === 0) {
    return (
      <Typography color='text.secondary' textAlign='center' sx={{ py: 4 }}>
        No cover bid jobs have been saved yet.
      </Typography>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Alert severity='info' sx={{ mb: 2 }}>
        This is a work in progress. I'm working to see if I can show the weekly
        cover bid jobs effectively. If you have some suggestions or feedback,
        please let me know.
      </Alert>
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'background.paper',
          borderBottom: '1px solid',
          borderColor: 'divider',
          p: { xs: 1.5, md: 2 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 1.5,
        }}
      >
        <TextField
          select
          size='small'
          label='Week ending'
          value={selectedWeek ?? ''}
          onChange={(e) => {
            setSelectedWeek(e.target.value);
            setPage(0);
          }}
          fullWidth
        >
          {weeks.map((week) => (
            <MenuItem key={week} value={week}>
              {dayjs(week).format('MM/DD/YYYY')}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          size='small'
          label='Search job # or description'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          fullWidth
        />
      </Box>

      <Typography
        variant='caption'
        color='text.secondary'
        sx={{ px: 2, py: 1, display: 'block' }}
      >
        {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''} found
      </Typography>

      {isDesktop ? (
        <Box sx={{ px: 1 }}>
          <DataGrid
            rows={filteredJobs}
            columns={DESKTOP_COLUMNS}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
            }}
            autoHeight
            getRowHeight={() => 'auto'}
            onRowClick={(params) => setSelectedJob(params.row)}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': { alignItems: 'center', py: 0.5 },
              '& .MuiDataGrid-row': { cursor: 'pointer' },
            }}
          />
        </Box>
      ) : (
        <Box sx={{ px: 1.5, pb: 2 }}>
          <Stack spacing={1.5}>
            {paginatedJobs.map((job) => (
              <CoverBidJobCard
                key={job._id}
                job={job}
                onSelect={setSelectedJob}
              />
            ))}
          </Stack>

          {filteredJobs.length === 0 && (
            <Typography
              color='text.secondary'
              textAlign='center'
              sx={{ py: 4 }}
            >
              No jobs saved for this week yet.
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

      <CoverBidJobDetailDialog
        job={selectedJob}
        open={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
      />
    </Box>
  );
}

export default CoverBidJobsTable;
