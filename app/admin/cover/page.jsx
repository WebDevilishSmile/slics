import { Paper, Typography } from '@mui/material';

import NoAccess from '@/components/admin/NoAccess';
import CoverJobChangesNotice from '@/components/admin/coverBidJobs/CoverJobChangesNotice';
import CoverReportsNotice from '@/components/admin/coverReports/CoverReportsNotice';
import CoverToolTiles from '@/components/admin/coverHub/CoverToolTiles';
import { COVER_TOOLS } from '@/constants';
import { getAreaSession } from '@/lib/authz';
import { getUnseenCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getCoverHubStatus } from '@/lib/db/coverHub';
import { getOpenCoverReportSummary } from '@/lib/db/coverReports';
import { getCoverChangesSeenAt } from '@/lib/db/users';
import theme from '@/theme';

// Cover-tab changes this admin hasn't seen, for the banner. A failure only
// hides it, as on /admin (StaffHub.jsx).
async function unseenChanges(userId) {
  try {
    return await getUnseenCoverJobChanges(await getCoverChangesSeenAt(userId));
  } catch (error) {
    console.error('Error loading unseen cover job changes for the Covers hub:', error);
    return { count: 0, latest: [], week: null };
  }
}

// Open driver reports on Covers, for their banner. Same rule.
async function openReports() {
  try {
    return await getOpenCoverReportSummary();
  } catch (error) {
    console.error('Error loading open cover reports for the Covers hub:', error);
    return { count: 0, weeks: [] };
  }
}

// The Covers hub (docs/COVER-BIDDING.md "Covers hub and History"): the one
// row on /admin and /dispatch for the Covers area opens here, and every cover
// tool is a tile (COVER_TOOLS). Checks the Covers area before reading
// anything, like every admin page (docs/SECURITY.md #7).
export default async function CoversHub() {
  const session = await getAreaSession('covers');
  if (!session) return <NoAccess />;

  const [changes, reports, status] = await Promise.all([
    unseenChanges(session.user.id),
    openReports(),
    getCoverHubStatus(),
  ]);

  return (
    <>
      <Typography variant='sectionHeading'>Covers</Typography>

      <Paper variant='panel' sx={{ maxWidth: theme.layout.width.wide, gap: 3 }}>
        <CoverReportsNotice {...reports} />
        <CoverJobChangesNotice {...changes} />
        <Typography variant='body2' color='text.secondary' sx={{ alignSelf: 'flex-start' }}>
          Status for the week bid on now, ending {status.weekLabel}.
        </Typography>
        <CoverToolTiles tools={COVER_TOOLS} lines={status.lines} />
      </Paper>
    </>
  );
}
