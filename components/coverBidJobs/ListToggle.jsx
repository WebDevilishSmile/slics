'use client';

import { Button, IconButton, Tooltip } from '@mui/material';
import { PlaylistAdd, PlaylistAddCheck } from '@mui/icons-material';

import { COVER_LIST_MAX } from '@/constants';
import { isPicked } from '@/lib/coverBidJobRow';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// Adds a job to the driver's cover list on /covers, or takes it off
// (covers/CoverBoard.jsx `listControls`). Pressed (aria-pressed, a checked
// icon in brand blue) while the job is on the list. A taken job can't be
// added, nor any job once the list is full; the tooltip says why.
// `variant='icon'` for the job table and cards, 'button' for the job dialog.
export default function ListToggle({ job, list, variant = 'icon' }) {
  const on = list.has(job);
  const disabled = !on && !list.canAdd(job);
  const reason = !disabled
    ? ''
    : isPicked(job)
      ? 'Taken'
      : list.full
        ? `Your list is full (${COVER_LIST_MAX} jobs)`
        : 'This job has no number';
  const label = on ? `Remove ${job.jobNumber} from your list` : `Add ${job.jobNumber} to your list`;
  const Icon = on ? PlaylistAddCheck : PlaylistAdd;
  const toggle = (event) => {
    event.stopPropagation();
    list.toggle(job);
  };

  if (variant === 'button') {
    return (
      <Button
        onClick={toggle}
        disabled={disabled}
        aria-pressed={on}
        startIcon={<Icon />}
        sx={[softRaisedSmall, softPressSx, { minHeight: '3rem', color: on ? 'primary.main' : 'text.primary' }]}
      >
        {on ? 'On your list · Remove' : disabled ? reason : 'Add to my list'}
      </Button>
    );
  }

  return (
    <Tooltip title={reason || label}>
      {/* A span so the tooltip still works on a disabled button. */}
      <span>
        <IconButton
          onClick={toggle}
          disabled={disabled}
          aria-pressed={on}
          aria-label={label}
          sx={[softPressSx, { width: '2.75rem', height: '2.75rem', color: on ? 'primary.main' : 'text.secondary' }]}
        >
          <Icon />
        </IconButton>
      </span>
    </Tooltip>
  );
}
