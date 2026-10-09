import { Paper, Typography } from '@mui/material';

import HydrationGuard from '@/components/utility/HydrationGuard';
import JobsRefreshButton from '@/components/admin/sheetJobs/JobsRefreshButton';
import SheetJobsView from '@/components/admin/sheetJobs/SheetJobsView';
import {
  getJobChanges,
  getJobsSyncState,
  getSheetJobs,
  serializeJobChanges,
  serializeSheetJobs,
} from '@/lib/db/sheetJobs';
import theme from '@/theme';

const CHANGES_PAGE = 100;

// Every job on the on-call sheet's Jobs tab and what changed between
// refreshes (docs/ON-CALL-SHEET-SYNC.md, stage 2). Reads MongoDB only; the
// Refresh button reads the sheet. app/admin/layout.jsx limits it to admins.
async function Jobs() {
  const [jobs, changes, syncState] = await Promise.all([
    getSheetJobs(),
    getJobChanges({ limit: CHANGES_PAGE }),
    getJobsSyncState(),
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
          <JobsRefreshButton lastSyncedAt={syncState?.lastSyncedAt ?? null} />
          <SheetJobsView
            jobs={serializeSheetJobs(jobs)}
            changes={serializeJobChanges(changes)}
            moreChanges={changes.length === CHANGES_PAGE}
          />
        </HydrationGuard>
      </Paper>
    </>
  );
}

export default Jobs;
