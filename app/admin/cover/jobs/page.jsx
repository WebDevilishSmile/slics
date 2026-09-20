'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import CoverCalendar from '@/app/components/covers/Calendar';
import BidSheetUploader from '@/app/components/admin/coverBidJobs/BidSheetUploader';
import CoverBidJobsManager from '@/app/components/admin/coverBidJobs/CoverBidJobsManager';
import BackButton from '@/app/components/layout/BackButton';
import { getUpcomingSaturday } from '@/utils/functions';
import { Box, Typography } from '@mui/material';

function CoverJobs() {
  // Default to next week — the week being posted — to match the driver-facing
  // cover bid jobs page.
  const [selectedDay, setSelectedDay] = useState(() => dayjs().add(1, 'week'));
  const [postedWeeks, setPostedWeeks] = useState(() => new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Memoized because the children use it as a useEffect dependency — a fresh
  // dayjs object each render would refetch forever.
  const weekEndDate = useMemo(
    () => getUpcomingSaturday(selectedDay),
    [selectedDay],
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchWeeks() {
      try {
        const res = await fetch('/api/coverBidJobs/weeks');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to load posted weeks');
        }
        if (!cancelled) setPostedWeeks(new Set(data.data));
      } catch (err) {
        // The dots are a hint, not a requirement — the page works without them.
        console.error(err);
      }
    }

    fetchWeeks();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <BackButton />
      <Typography variant='sectionHeading'>Cover Jobs</Typography>

      <CoverCalendar
        value={selectedDay}
        setValue={setSelectedDay}
        postedWeeks={postedWeeks}
      />
      <Box sx={{ my: 2, px: { xs: 2, md: 1 } }}>
        <BidSheetUploader
          weekEndDate={weekEndDate}
          onSaved={() => setRefreshKey((key) => key + 1)}
        />
        <CoverBidJobsManager
          weekEndDate={weekEndDate}
          refreshKey={refreshKey}
        />
      </Box>
    </>
  );
}

export default CoverJobs;
