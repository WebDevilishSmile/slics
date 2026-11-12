'use client';

import { useState } from 'react';
import { ExpandMore, WarningAmberRounded } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx } from '@/components/utility/soft';

// Collapsed or open, per device: a convenience in localStorage. It starts
// open, so every driver reads it at least once.
const KEY = 'slics-driving-notice';
function readCollapsed() {
  try {
    return localStorage.getItem(KEY) === 'collapsed';
  } catch {
    return false;
  }
}
function saveCollapsed(collapsed) {
  try {
    localStorage.setItem(KEY, collapsed ? 'collapsed' : 'open');
  } catch {
    // Storage blocked: open again next time.
  }
}

// The safety note above the directions (docs/SLIC-DIRECTIONS.md, stage 2):
// don't use the phone while driving, and the screen stays on while the
// directions are open (hooks/useWakeLock.js). Closing it folds it into a
// one-line "Driving safety" button that opens it again. Rendered only in the
// browser (the sheet mounts on a tap), so it reads storage at once.
export default function DrivingNotice() {
  const [collapsed, setCollapsed] = useState(readCollapsed);

  const toggle = (next) => {
    setCollapsed(next);
    saveCollapsed(next);
  };

  if (collapsed) {
    return (
      <Button
        size='small'
        onClick={() => toggle(false)}
        aria-expanded='false'
        startIcon={<WarningAmberRounded />}
        endIcon={<ExpandMore />}
        sx={[softPressSx, { alignSelf: 'flex-start', minHeight: '2.75rem', px: 1.5, color: 'text.secondary' }]}
      >
        Driving safety
      </Button>
    );
  }

  return (
    <SoftNotice icon={<WarningAmberRounded />} onClose={() => toggle(true)} closeLabel='Fold the safety note'>
      <strong>Don&apos;t use your phone while driving.</strong> Read the steps before you pull out,
      or while you&apos;re stopped. While the directions are open, your screen stays on.
    </SoftNotice>
  );
}
