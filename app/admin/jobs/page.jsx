import { Box, Paper, Typography } from '@mui/material';

import { getSession } from '@/lib/authz';
import HydrationGuard from '@/components/utility/HydrationGuard';
import JobsRefreshButton from '@/components/admin/sheetJobs/JobsRefreshButton';
import SheetJobsView from '@/components/admin/sheetJobs/SheetJobsView';
import SheetSyncHealth from '@/components/admin/sheetJobs/SheetSyncHealth';
import {
  getJobChanges,
  getJobsSyncState,
  getSheetJobs,
  serializeJobChanges,
  serializeSheetJobs,
} from '@/lib/db/sheetJobs';
import { getSheetSyncHealth } from '@/lib/db/syncState';
import { getJobChangesSeenAt } from '@/lib/db/users';
import { todayInNewYork } from '@/lib/onCallSheet';
import theme from '@/theme';

const CHANGES_PAGE = 100;

// Every job on the on-call sheet's Jobs tab and what changed between
// refreshes (docs/ON-CALL-SHEET-SYNC.md, stage 2). Reads MongoDB only; the
// Refresh button reads the sheet. Under it, whether the sheet's notifier and
// the automatic reads are working (stage 3). app/admin/layout.jsx limits it to
// admins.
async function Jobs() {
  const session = await getSession();
  const [jobs, changes, syncState, health, seenAt] = await Promise.all([
    getSheetJobs(),
    getJobChanges({ limit: CHANGES_PAGE }),
    getJobsSyncState(),
    getSheetSyncHealth({ today: todayInNewYork() }),
    getJobChangesSeenAt(session?.user?.id),
  ]);

  return (
    <>
      <Typography variant='sectionHeading'>Jobs</Typography>

      <Paper
        variant='panel'
        sx={{
          maxWidth: theme.layout.width.page,
          minHeight: 0,
          alignItems: 'stretch',
          gap: 4,
          my: 2,
          px: { xs: 1, md: 3 },
          py: 3,
        }}
      >
        {/* Times show in the browser's time zone, so this renders client-side
            only (the server runs in UTC). */}
        <HydrationGuard>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            <JobsRefreshButton
              lastSyncedAt={syncState?.lastSyncedAt ?? null}
              lastSource={syncState?.lastSource ?? null}
            />
            <SheetSyncHealth lastPingAt={health.lastPingAt} errors={health.errors} />
          </Box>
          <SheetJobsView
            jobs={serializeSheetJobs(jobs)}
            changes={serializeJobChanges(changes)}
            moreChanges={changes.length === CHANGES_PAGE}
            seenAt={seenAt}
          />
        </HydrationGuard>
      </Paper>
    </>
  );
}

export default Jobs;
