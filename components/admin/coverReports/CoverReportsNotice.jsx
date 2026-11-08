'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, OutlinedFlag } from '@mui/icons-material';
import { Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { formatWeekEnding } from '@/lib/onCallSheet';

const WEEKS_SHOWN = 3;

// The banner for open cover reports on /admin and the Covers hub: "2 open
// cover reports (W/E 11/14/2026)" and a way to the queue. `count` and `weeks`
// come from getOpenCoverReportSummary. Renders nothing when none are open.
export default function CoverReportsNotice({ count, weeks }) {
  if (!count) return null;

  const named =
    weeks.slice(0, WEEKS_SHOWN).map((week) => `W/E ${formatWeekEnding(week)}`).join(', ') +
    (weeks.length > WEEKS_SHOWN ? ', …' : '');

  return (
    <SoftNotice
      icon={<OutlinedFlag />}
      actions={
        <Button
          component={Link}
          href='/admin/cover/reports'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          View reports
        </Button>
      }
    >
      <strong>
        {count} open cover report{count === 1 ? '' : 's'}
      </strong>{' '}
      from drivers ({named})
    </SoftNotice>
  );
}
