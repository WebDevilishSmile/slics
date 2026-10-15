'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, VerifiedOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The /admin banner for driver claims waiting for a decision and open cover
// list disputes (docs/COVER-BIDDING.md), both on /admin/driver-claims, and a
// way there. `count` comes from getPendingClaimCount, `disputes` from
// getOpenDisputeCount. Renders nothing when neither is waiting.
export default function DriverClaimsNotice({ count, disputes = 0 }) {
  if (!count && !disputes) return null;

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
          {count ? 'Review claims' : 'Review'}
        </Button>
      }
    >
      {count > 0 && (
        <>
          <strong>
            {count} driver claim{count === 1 ? '' : 's'}
          </strong>{' '}
          waiting to be verified
          {disputes > 0 && <br />}
        </>
      )}
      {disputes > 0 && (
        <>
          <strong>
            {disputes} driver{disputes === 1 ? '' : 's'}
          </strong>{' '}
          {disputes === 1 ? 'says they' : 'say they'} should be on the cover list
        </>
      )}
    </SoftNotice>
  );
}
