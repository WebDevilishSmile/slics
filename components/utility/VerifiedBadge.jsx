'use client';

import { Verified } from '@mui/icons-material';
import { Tooltip } from '@mui/material';

// The check mark beside a verified driver's name (docs/COVER-BIDDING.md): an
// admin linked the account to its name on the on-call sheet. Sized to the text
// it sits in. Brand blue; pass `color='inherit'` on the blue menu header.
export default function VerifiedBadge({ color = 'primary.main', sx }) {
  return (
    <Tooltip title='Verified driver'>
      <Verified
        titleAccess='Verified driver'
        sx={[
          { color, fontSize: '1.1em', verticalAlign: '-0.15em', ml: 0.5, flexShrink: 0 },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
      />
    </Tooltip>
  );
}
