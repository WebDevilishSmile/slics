'use client';

import { Box, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { softPressSx } from '@/components/utility/soft';
import { DAY_FIELDS } from '@/lib/dayFormat';
import { isPicked } from '@/lib/coverBidJobRow';
import JobCard from './JobCard';
import ListToggle from './ListToggle';

// A cover bid job (flat day fields: job.sun … job.sat) on the shared JobCard.
// With `list` (a verified driver on /covers), the add/remove button for their
// cover list sits beside the details button.
function CoverBidJobCard({ job, onSelect, list = null }) {
  const days = DAY_FIELDS.filter((day) => job[day]).map((day) => ({
    day,
    value: job[day],
  }));

  return (
    <JobCard
      title={job.jobNumber}
      days={days}
      description={job.description}
      picked={isPicked(job)}
      hidden={Boolean(job.hidden)}
      action={
        (onSelect || list) && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {list && <ListToggle job={job} list={list} />}
            {onSelect && (
              <IconButton
                size='small'
                onClick={() => onSelect(job)}
                aria-label='View details'
                sx={softPressSx}
              >
                <InfoOutlinedIcon fontSize='small' />
              </IconButton>
            )}
          </Box>
        )
      }
    />
  );
}

export default CoverBidJobCard;
