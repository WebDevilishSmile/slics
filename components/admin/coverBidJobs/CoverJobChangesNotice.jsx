'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined, NotificationsActiveOutlined } from '@mui/icons-material';
import { Box, Button } from '@mui/material';

import SoftNotice from '@/components/utility/SoftNotice';
import { softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { changeJob, describeCoverJobChange } from './coverJobChangeText';

// The /admin banner for cover-tab changes the admin hasn't seen
// (docs/ON-CALL-SHEET-SYNC.md, "Alerts"): "3 cover job changes since you last
// looked", the newest 3, and a way to /admin/cover/jobs on the newest one's
// week, which clears it. `count`, `latest` and `week` come from
// getUnseenCoverJobChanges. Renders nothing when there's nothing new.
export default function CoverJobChangesNotice({ count, latest, week }) {
  if (!count) return null;

  return (
    <SoftNotice
      icon={<NotificationsActiveOutlined />}
      actions={
        <Button
          component={Link}
          href={week ? `/admin/cover/jobs?week=${week}` : '/admin/cover/jobs'}
          endIcon={<ChevronRightOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '2.75rem', ml: 1 }]}
        >
          View changes
        </Button>
      }
    >
      <strong>
        {count} cover job change{count === 1 ? '' : 's'}
      </strong>{' '}
      since you last looked
      {/* Spans, not a list: SoftNotice puts its message in a <p>. */}
      <Box component='span' sx={{ display: 'grid', gap: 0.5, mt: 1 }}>
        {latest.map((change) => {
          const job = changeJob(change);
          return (
            <Box component='span' key={change._id} sx={{ display: 'block', color: 'text.secondary' }}>
              W/E {formatWeekEnding(change.weekEnding)} ·{' '}
              {job && (
                <>
                  <Box component='strong' sx={{ color: 'text.primary' }}>
                    {job}
                  </Box>{' '}
                  ·{' '}
                </>
              )}
              {describeCoverJobChange(change)}
            </Box>
          );
        })}
      </Box>
    </SoftNotice>
  );
}
