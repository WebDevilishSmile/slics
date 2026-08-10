'use client';

import { useState } from 'react';
import dayjs from 'dayjs';

import CoverCalendar from '@/app/components/covers/Calendar';
import BidSheetUploader from '@/app/components/admin/coverBidJobs/BidSheetUploader';
import CoverBidJobsManager from '@/app/components/admin/coverBidJobs/CoverBidJobsManager';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';
import { getUpcomingSaturday } from '@/utils/functions';

function CoverJobs() {
  const [weekEndDate, setWeekEndDate] = useState(() =>
    getUpcomingSaturday(dayjs()),
  );
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <BackButton />
      <StyledHeading>Cover Jobs</StyledHeading>

      <CoverCalendar setWeekEndDate={setWeekEndDate} />
      <BidSheetUploader
        weekEndDate={weekEndDate}
        onSaved={() => setRefreshKey((key) => key + 1)}
      />
      <CoverBidJobsManager weekEndDate={weekEndDate} refreshKey={refreshKey} />
    </>
  );
}

export default CoverJobs;
