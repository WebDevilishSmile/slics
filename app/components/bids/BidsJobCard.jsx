'use client';

import { Chip } from '@mui/material';
import JobCard from '../coverBidJobs/JobCard';
import { softRaisedSmall } from '../utility/soft';

// A bid job (`job.schedule` maps day → time, null on days off) on the shared
// JobCard.
function BidsJobCard({ job }) {
  const days = Object.entries(job.schedule || {})
    .filter(([, time]) => time !== null)
    .map(([day, value]) => ({ day, value }));

  return (
    <JobCard
      title={job.job_name}
      days={days}
      description={job.description}
      action={
        job.bid_destination && (
          <Chip
            label={job.bid_destination}
            sx={[
              softRaisedSmall,
              { ml: 1, fontWeight: 600, flexShrink: 0, color: 'primary.main' },
            ]}
          />
        )
      }
    />
  );
}

export default BidsJobCard;
