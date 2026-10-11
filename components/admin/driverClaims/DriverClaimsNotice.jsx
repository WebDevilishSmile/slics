'use client';

import Link from 'next/link';
import { ChevronRightOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The /admin banner for driver claims waiting for a decision
// (docs/COVER-BIDDING.md) and a way to the queue. `count` comes from
// getPendingClaimCount. Renders nothing when none are waiting.
export default function DriverClaimsNotice({ count }) {
  if (!count) return null;

  return (
    <SoftNotice
      icon={<VerifiedOutlined />}
      actions={
        <Button
          component={Link}
          href='/admin/driver-claims'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          Review claims
        </Button>
      }
    >
      <strong>
        {count} driver claim{count === 1 ? '' : 's'}
      </strong>{' '}
      waiting to be verified
    </SoftNotice>
  );
}
