'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, WarehouseOutlined } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

// The /admin banner for home building changes verified drivers or staff asked
// for (docs/MULTI-HUB.md "Home base", step 4), with a way to the accounts:
// /admin/users filtered to "Change asked", each decided on the user's page.
// `count` comes from countHomeBaseRequests. Renders nothing when none wait.
export default function HomeBaseRequestsNotice({ count }) {
  if (!count) return null;

  return (
    <SoftNotice
      icon={<WarehouseOutlined />}
      actions={
        <Button
          component={Link}
          href='/admin/users?home=asked'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          Review
        </Button>
      }
    >
      <strong>
        {count} building change{count === 1 ? '' : 's'}
      </strong>{' '}
      waiting for an admin
    </SoftNotice>
  );
}
