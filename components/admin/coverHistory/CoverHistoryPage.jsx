'use client';

import { useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

import HubSection from '@/components/admin/hub/HubSection';
import { shortDate } from '@/components/admin/hub/format';
import theme from '@/theme';
import DriverTrendsTable from './DriverTrendsTable';
import JobTrendsTable from './JobTrendsTable';
import PatternList from './PatternList';
import RangeToggle from './RangeToggle';
import WeekCharts from './WeekCharts';
import WeekDetail from './WeekDetail';
import { useHistoryNav } from './useHistoryNav';

const SECTION_IDS = { jobs: 'history-jobs-table', drivers: 'history-drivers-table' };

// Cover History (/admin/cover/history, docs/COVER-BIDDING.md "Covers hub and
// History"): past weeks read side by side. What stands out first, then the
// weeks as charts, every job and every driver across them, and one week up
// close. `history` is getCoverHistory (lib/db/coverHistory.js), read on the
// server for the range and week in the address.
export default function CoverHistoryPage({ history, ranges }) {
  const { range, weeks, summaries, jobs, drivers, patterns, detail } = history;
  const { go, pending } = useHistoryNav({ range, week: detail.weekEnding });
  const [jobFilter, setJobFilter] = useState(null);

  const openWeek = (weekEnding) => {
    const inRange = summaries.some((week) => week.weekEnding === weekEnding);
    go({ week: weekEnding, range: inRange ? range : 'all', hash: 'history-week' });
  };
  const openAnchor = (anchor) => {
    if (anchor.week) return openWeek(anchor.week);
    if (anchor.section === 'jobs') setJobFilter(anchor.filter ?? null);
    document.getElementById(SECTION_IDS[anchor.section])?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <Paper
      variant='panel'
      sx={{ maxWidth: theme.layout.width.page, minHeight: 0, alignItems: 'stretch', gap: 4, px: { xs: 2, md: 3 }, py: 3 }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <RangeToggle ranges={ranges} range={range} disabled={pending} onChange={(value) => go({ range: value, week: null })} />
        <Typography variant='body2' color='text.secondary' aria-live='polite'>
          {pending
            ? 'Reading the weeks…'
            : `${summaries.length} of ${weeks.length} saved weeks, W/E ${shortDate(summaries[0].weekEnding)} to ${shortDate(summaries.at(-1).weekEnding)}. Only weeks already bid on.`}
        </Typography>
      </Box>

      <HubSection id='history-patterns' title='What stands out'>
        <PatternList patterns={patterns} onOpen={openAnchor} />
      </HubSection>

      <HubSection id='history-weeks' title='Week by week' description='Tap a week to see it up close.'>
        <WeekCharts summaries={summaries} onWeek={openWeek} />
      </HubSection>

      <Box id={SECTION_IDS.jobs} sx={{ scrollMarginTop: '5rem' }}>
        <HubSection
          id='history-jobs-heading'
          title='Jobs'
          description='Every cover job number in these weeks: how often it came back, was taken, and how early on the pick list.'
        >
          <JobTrendsTable jobs={jobs} filter={jobFilter} setFilter={setJobFilter} />
        </HubSection>
      </Box>

      <Box id={SECTION_IDS.drivers} sx={{ scrollMarginTop: '5rem' }}>
        <HubSection
          id='history-drivers-heading'
          title='Drivers'
          description='Everyone on the pick lists in these weeks.'
        >
          <DriverTrendsTable drivers={drivers} />
        </HubSection>
      </Box>

      <Box id='history-week' sx={{ scrollMarginTop: '5rem' }}>
        <HubSection id='history-week-heading' title='A week up close'>
          <WeekDetail detail={detail} weeks={weeks} onWeek={openWeek} pending={pending} />
        </HubSection>
      </Box>
    </Paper>
  );
}
