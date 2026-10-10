'use client';

import { useState } from 'react';
import { LocalCafeOutlined } from '@mui/icons-material';

import SoftNotice from '@/components/utility/SoftNotice';

// A one-time thank-you on /home after a driver supports the app on Buy Me a
// Coffee (docs/BMC-SUPPORT.md stage 3). `support` is the newest support not
// yet thanked, from the server; dismissing it stamps it so it won't return.
export default function SupportThanks({ support, firstName }) {
  const [open, setOpen] = useState(!!support);
  if (!open) return null;

  const what =
    support.type === 'membership.started' ? 'Thanks for becoming a member' : 'Thanks for the coffee';

  const dismiss = () => {
    setOpen(false);
    // Best effort: if it fails, the notice shows once more next visit.
    fetch('/api/users/me/thanks', { method: 'POST' }).catch(() => {});
  };

  return (
    <SoftNotice
      icon={<LocalCafeOutlined />}
      onClose={dismiss}
      closeLabel='Dismiss thank-you'
      sx={{ mt: 3 }}
    >
      {what}
      {firstName ? `, ${firstName}` : ''}. Support like yours keeps SLICs running for every
      driver.
    </SoftNotice>
  );
}
