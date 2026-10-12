'use client';

import { useState } from 'react';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { tapHaptic } from '@/lib/haptics';

// Hides a job from drivers' /covers, or shows it again
// (docs/COVER-JOB-HIDING.md). A toggle: pressed (and the crossed-out eye)
// while hidden. It follows the job number as saved, the one /covers sees, so
// it waits for a saved row with a number. The week's summary line in
// CoverBidJobsManager announces the change.
export default function HideJobButton({
  row,
  hidden,
  onToggle,
  busy = false,
  disabled = false,
  size = 'medium',
  sx,
}) {
  // The icon pops in after a tap, not when the page loads.
  const [tapped, setTapped] = useState(false);

  const jobNumber = row.saved?.jobNumber?.trim() ?? '';
  const blocked = !row.saved
    ? 'Save this job before hiding it'
    : !jobNumber
      ? "A job with no job number can't be hidden"
      : null;
  const label = jobNumber ? `Hide job ${jobNumber} from drivers` : 'Hide from drivers';
  const tooltip = blocked ?? (hidden ? `Hidden from drivers. Show job ${jobNumber}` : label);

  const handleClick = () => {
    tapHaptic();
    setTapped(true);
    onToggle(row);
  };

  const pop = tapped ? 'pop' : undefined;

  return (
    <Tooltip title={tooltip}>
      {/* A disabled button emits no events, so the tooltip needs a live wrapper. */}
      <span>
        <IconButton
          aria-label={label}
          aria-pressed={hidden}
          size={size}
          onClick={handleClick}
          disabled={Boolean(blocked) || busy || disabled}
          sx={sx}
        >
          {busy ? (
            <CircularProgress size={18} color='inherit' />
          ) : hidden ? (
            <VisibilityOffIcon key='hidden' fontSize={size} className={pop} />
          ) : (
            <VisibilityIcon key='shown' fontSize={size} className={pop} />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
}
