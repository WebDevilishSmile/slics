'use client';

import { useMemo, useState } from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Stack,
  TablePagination,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import CoverBidJobCard from './CoverBidJobCard';
import CoverBidJobDetailDialog from './CoverBidJobDetailDialog';
import ListToggle from './ListToggle';
import { DAY_FIELDS, DAY_LABELS } from '@/lib/dayFormat';
import {
  DayTimeChip,
  descriptionColumn,
  filterBarSx,
  HiddenLabel,
  hiddenSx,
  JOB_GRID_SX,
  jobGridCardSx,
  PickedLabel,
  pickedSx,
} from './jobGrid';
import { isPicked } from '@/lib/coverBidJobRow';
import CoverCalendar from '@/components/covers/Calendar';
import SoftNotice from '@/components/utility/SoftNotice';
import { softInputSx } from '@/components/utility/soft';
import { getUpcomingSaturday } from '@/lib/format';

const DAY_COLUMNS = DAY_FIELDS.map((day) => ({
  field: day,
  headerName: DAY_LABELS[day],
  width: 90,
  sortable: false,
  renderCell: ({ value }) =>
    value ? <DayTimeChip day={day} value={value} /> : null,
}));

const DESKTOP_COLUMNS = [
  {
    field: 'jobNumber',
    headerName: 'Job #',
    width: 100,
    sortable: true,
    renderCell: ({ row, value }) => (
      <Box>
        {value}
        {isPicked(row) && <PickedLabel sx={{ display: 'flex' }} />}
        {row.hidden && <HiddenLabel sx={{ display: 'flex' }} />}
      </Box>
    ),
  },
  ...DAY_COLUMNS,
  descriptionColumn,
];

const CARDS_PER_PAGE = 50;

// On /covers, a verified driver's add/remove button, first in each row
// (covers/CoverBoard.jsx `listControls`).
function listColumn(list) {
  return {
    field: 'myList',
    headerName: 'My list',
    width: 84,
    sortable: false,
    renderCell: ({ row }) => <ListToggle job={row} list={list} />,
  };
}

// The cover jobs for a week, with a calendar to pick the week: /covers (inside
// covers/CoverBoard.jsx) and /cover-bid-jobs.
// - `selectedDay` / `onSelectDay`: optional, to hold the chosen day outside
//   (CoverBoard keeps the driver's list on the same week); otherwise the
//   table keeps its own.
// - `list`: optional controls for the driver's cover list; each job then gets
//   an add/remove button (ListToggle).
// - `beforeJobs`: optional content between the week's filters and its jobs
//   (the driver's list).
function CoverBidJobsTable({
  jobs,
  minWeekEnding,
  selectedDay: controlledDay,
  onSelectDay,
  list = null,
  beforeJobs = null,
}) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  const weeks = useMemo(
    () => [...new Set(jobs.map((job) => job.weekEnding))],
    [jobs],
  );

  // Default to next week — that's the week drivers are bidding on. Today still
  // gets its own ring on the calendar so the current date stays obvious.
  const [ownDay, setOwnDay] = useState(() => dayjs().add(1, 'week'));
  const selectedDay = controlledDay ?? ownDay;
  const setSelectedDay = onSelectDay ?? setOwnDay;
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [selectedJob, setSelectedJob] = useState(null);

  // The picked day is the source of truth; the week it belongs to is derived.
  const selectedWeek = useMemo(
    () => getUpcomingSaturday(selectedDay).format('YYYY-MM-DD'),
    [selectedDay],
  );

  const postedWeeks = useMemo(() => new Set(weeks), [weeks]);
  const columns = useMemo(
    () => (list ? [listColumn(list), ...DESKTOP_COLUMNS] : DESKTOP_COLUMNS),
    [list],
  );
  const isWeekPosted = postedWeeks.has(selectedWeek);

  // Start of the oldest loaded week, so that week's Sun-Fri stay clickable.
  const minDate = useMemo(
    () => (minWeekEnding ? dayjs(minWeekEnding).startOf('week') : undefined),
    [minWeekEnding],
  );

  const selectWeek = (day) => {
    setSelectedDay(day);
    setPage(0);
  };

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

  return (
    <Box sx={{ width: '100%' }}>
      <SoftNotice sx={{ maxWidth: 'none', mt: 3, mb: 3 }}>
        This is a work in progress. I&apos;m working to see if I can show the
        weekly cover bid jobs effectively. If you have some suggestions or
        feedback, please let me know.
      </SoftNotice>
      <Box sx={filterBarSx}>
        <CoverCalendar
          value={selectedDay}
          setValue={selectWeek}
          postedWeeks={postedWeeks}
          minDate={minDate}
        />

        <TextField
          placeholder='Search job # or description'
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
          fullWidth
          sx={softInputSx}
          slotProps={{
            htmlInput: { 'aria-label': 'Search job # or description' },
          }}
        />
      </Box>

      <Box sx={{ px: 2, pt: 2, pb: 1 }}>
        <Typography variant='caption' color='text.secondary' display='block'>
          Today is {dayjs().format('MM/DD/YYYY')}
        </Typography>
        {isWeekPosted && (
          <Typography variant='caption' color='text.secondary' display='block'>
            {filteredJobs.length} job{filteredJobs.length !== 1 ? 's' : ''}{' '}
            found for the week ending {dayjs(selectedWeek).format('MM/DD/YYYY')}
          </Typography>
        )}
      </Box>

      {beforeJobs}

      {!isWeekPosted ? (
        <SoftNotice sx={{ maxWidth: 'none', my: 3 }}>
          Cover bid jobs for the week ending{' '}
          {dayjs(selectedWeek).format('MM/DD/YYYY')} have not been posted yet.
        </SoftNotice>
      ) : isDesktop ? (
        <Box sx={jobGridCardSx}>
          <DataGrid
            rows={filteredJobs}
            columns={columns}
            getRowId={(row) => row._id}
            pageSizeOptions={[10, 25, 50, 100]}
            initialState={{
              pagination: { paginationModel: { pageSize: 50 } },
            }}
            autoHeight
            getRowHeight={() => 'auto'}
            onRowClick={(params) => setSelectedJob(params.row)}
            getRowClassName={({ row }) =>
              [isPicked(row) && 'picked', row.hidden && 'hidden'].filter(Boolean).join(' ')
            }
            slots={{
              noRowsOverlay: () => (
                <Typography
                  color='text.secondary'
                  textAlign='center'
                  sx={{ py: 4 }}
                >
                  No jobs match your search.
                </Typography>
              ),
            }}
            sx={{
              ...JOB_GRID_SX,
              '& .MuiDataGrid-row': { cursor: 'pointer' },
              '& .MuiDataGrid-row.picked': pickedSx,
              '& .MuiDataGrid-row.hidden': hiddenSx,
            }}
          />
        </Box>
      ) : (
        <Box sx={{ pt: 1, pb: 2 }}>
          {/* Room between cards for the soft shadows. */}
          <Stack spacing={2.5}>
            {paginatedJobs.map((job) => (
              <CoverBidJobCard
                key={job._id}
                job={job}
                onSelect={setSelectedJob}
                list={list}
              />
            ))}
          </Stack>

          {filteredJobs.length === 0 && (
            <Typography
              color='text.secondary'
              textAlign='center'
              sx={{ py: 4 }}
            >
              No jobs match your search.
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
        list={list}
      />
    </Box>
  );
}

export default CoverBidJobsTable;
