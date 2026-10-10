'use client';

import Link from 'next/link';
import { ChevronRightOutlined, NotificationsActiveOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { describeJobChange } from './jobChangeText';

const JOBS_SHOWN = 4;

// The /admin banner for Jobs-tab changes the admin hasn't seen
// (docs/ON-CALL-SHEET-SYNC.md, stage 3 alerts): "3 job changes since you last
// looked (LV56, BE11)", the newest 3, and a way to /admin/jobs, which clears it.
// `count`, `jobs` and `latest` come from getUnseenJobChanges. Renders nothing
// when there's nothing new.
export default function JobChangesNotice({ count, jobs, latest }) {
  if (!count) return null;

  const named = jobs.slice(0, JOBS_SHOWN).join(', ') + (jobs.length > JOBS_SHOWN ? ', …' : '');

  return (
    <SoftNotice
      icon={<NotificationsActiveOutlined />}
      actions={
        <Button
          component={Link}
          href='/admin/jobs'
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          View changes
        </Button>
      }
    >
      <strong>
        {count} job change{count === 1 ? '' : 's'}
      </strong>{' '}
      since you last looked ({named})
      {/* Spans, not a list: SoftNotice puts its message in a <p>. */}
      <Box component='span' sx={{ display: 'grid', gap: 0.5, mt: 1 }}>
        {latest.map((change) => (
          <Box component='span' key={change._id} sx={{ display: 'block', color: 'text.secondary' }}>
            <Box component='strong' sx={{ color: 'text.primary' }}>
              {change.jobName}
            </Box>{' '}
            · {describeJobChange(change)}
          </Box>
        ))}
      </Box>
    </SoftNotice>
  );
}
