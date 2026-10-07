'use client';

import { IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { DAY_FIELDS } from './dayFormat';
import JobCard from './JobCard';

// A cover bid job (flat day fields: job.sun … job.sat) on the shared JobCard.
function CoverBidJobCard({ job, onSelect }) {
  const days = DAY_FIELDS.filter((day) => job[day]).map((day) => ({
    day,
    value: job[day],
  }));

  return (
    <JobCard
      title={job.jobNumber}
      days={days}
      description={job.description}
      action={
        onSelect && (
          <IconButton
            size='small'
            onClick={() => onSelect(job)}
            aria-label='View details'
          >
            <InfoOutlinedIcon fontSize='small' />
          </IconButton>
        )
      }
    />
  );
}

export default CoverBidJobCard;
