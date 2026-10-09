'use client';

import { useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';

import CoverCalendar from '@/components/covers/Calendar';
import CoverBidJobsManager from '@/components/admin/coverBidJobs/CoverBidJobsManager';
import CoverBidPicks from '@/components/admin/coverBidJobs/CoverBidPicks';
import SheetRefreshButton from '@/components/admin/coverBidJobs/SheetRefreshButton';
import { useCoverBidPicks } from '@/hooks/useCoverBidPicks';
import { getUpcomingSaturday } from '@/lib/format';
import { Paper, Typography } from '@mui/material';
import theme from '@/theme';

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
  const pickState = useCoverBidPicks({ weekEndDate, refreshKey });

  // A refresh saved the week: refetch its jobs and picks, and dot it on the
  // calendar.
  const handleRefreshed = (weekEnding) => {
    setRefreshKey((key) => key + 1);
    setPostedWeeks((weeks) => new Set(weeks).add(weekEnding));
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchWeeks() {
      try {
        const res = await fetch('/api/cover-bid-jobs/weeks');
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
      <Typography variant='sectionHeading'>Cover Jobs</Typography>

      <Paper
        variant='panel'
        sx={{
          maxWidth: theme.layout.width.page,
          minHeight: 0,
          alignItems: 'stretch',
          my: 2,
          px: { xs: 1, md: 3 },
        }}
      >
        {/* The week picker is the panel's first control, as on /cover-bid-jobs. */}
        <CoverCalendar
          value={selectedDay}
          setValue={setSelectedDay}
          postedWeeks={postedWeeks}
        />
        {/* The week comes from the on-call sheet (docs/ON-CALL-SHEET-SYNC.md);
            the photo upload (BidSheetUploader) is retired but kept until stage 4. */}
        <SheetRefreshButton
          key={weekEndDate.format('YYYY-MM-DD')}
          weekEndDate={weekEndDate}
          onRefreshed={handleRefreshed}
        />
        <CoverBidJobsManager
          weekEndDate={weekEndDate}
          refreshKey={refreshKey}
          picks={pickState.picks}
        />
        <CoverBidPicks {...pickState} />
      </Paper>
    </>
  );
}

export default CoverJobs;
