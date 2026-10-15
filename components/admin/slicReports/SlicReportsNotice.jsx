'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, OutlinedFlag } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';

const SLICS_SHOWN = 4;

// The /admin banner for open SLIC reports (RECOMMENDATIONS.md #5): "2 open
// SLIC reports (LV56, Acme Foods)" and a way to the queue. `count` and
// `slics` come from getOpenReportSummary. Renders nothing when none are open.
export default function SlicReportsNotice({ count, slics }) {
  if (!count) return null;

  const named = slics.slice(0, SLICS_SHOWN).join(', ') + (slics.length > SLICS_SHOWN ? ', …' : '');

  return (
    <SoftNotice
      icon={<OutlinedFlag />}
      actions={
        <Button
          component={Link}
          href='/admin/reports'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          View reports
        </Button>
      }
    >
      <strong>
        {count} open SLIC report{count === 1 ? '' : 's'}
      </strong>{' '}
      from drivers ({named})
    </SoftNotice>
  );
}
