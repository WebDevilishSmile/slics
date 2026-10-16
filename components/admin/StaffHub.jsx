import AdminLinks from '@/components/admin/AdminLinks';
import CoverJobChangesNotice from '@/components/admin/coverBidJobs/CoverJobChangesNotice';
import DriverClaimsNotice from '@/components/admin/driverClaims/DriverClaimsNotice';
import JobChangesNotice from '@/components/admin/sheetJobs/JobChangesNotice';
import SlicReportsNotice from '@/components/admin/slicReports/SlicReportsNotice';
import { getOpenDisputeCount } from '@/lib/db/coverDisputes';
import { getUnseenCoverJobChanges } from '@/lib/db/coverJobChanges';
import { getPendingClaimCount } from '@/lib/db/driverClaims';
import { getUnseenJobChanges } from '@/lib/db/sheetJobs';
import { getOpenReportSummary } from '@/lib/db/slicReports';
import { getCoverChangesSeenAt, getJobChangesSeenAt } from '@/lib/db/users';
import { areaEntries } from '@/lib/staffAreas';

// Jobs-tab changes this account hasn't seen, for the banner. A failure only
// hides the banner: a hub must always load.
async function unseenJobChanges(userId) {
  try {
    return await getUnseenJobChanges(await getJobChangesSeenAt(userId));
  } catch (error) {
    console.error('Error loading unseen job changes for a staff hub:', error);
    return { count: 0, jobs: [], latest: [] };
  }
}

// Cover-tab changes this account hasn't seen, for theirs. Same rule: a failure
// only hides it.
async function unseenCoverJobChanges(userId) {
  try {
    return await getUnseenCoverJobChanges(await getCoverChangesSeenAt(userId));
  } catch (error) {
    console.error('Error loading unseen cover job changes for a staff hub:', error);
    return { count: 0, latest: [], week: null };
  }
}

// Open driver reports on SLICs, for their banner. Same rule.
async function openReports() {
  try {
    return await getOpenReportSummary();
  } catch (error) {
    console.error('Error loading open SLIC reports for a staff hub:', error);
    return { count: 0, slics: [] };
  }
}

// Driver claims waiting for a decision, for their banner. Same rule.
async function pendingClaims() {
  try {
    return await getPendingClaimCount();
  } catch (error) {
    console.error('Error counting driver claims for a staff hub:', error);
    return 0;
  }
}

// Open cover list disputes, which share the claims banner. Same rule.
async function openDisputes() {
  try {
    return await getOpenDisputeCount();
  } catch (error) {
    console.error('Error counting cover disputes for a staff hub:', error);
    return 0;
  }
}

// The banners and links of a staff hub, /admin or /dispatch
// (docs/STAFF-ROLES.md), for the areas (keys) given: each area's links in
// STAFF_AREAS order, and each banner read only when its area is there.
// `extraLinks` go last (the super admin's hub link).
export default async function StaffHub({ areas, userId, extraLinks = [], label }) {
  const has = (key) => areas.includes(key);
  const [jobChanges, coverJobChanges, reports, claims, disputes] = await Promise.all([
    has('jobs') ? unseenJobChanges(userId) : null,
    has('covers') ? unseenCoverJobChanges(userId) : null,
    has('reports') ? openReports() : null,
    has('driverClaims') ? pendingClaims() : 0,
    has('driverClaims') ? openDisputes() : 0,
  ]);
  const links = [...areaEntries(areas).flatMap((area) => area.links), ...extraLinks];

  return (
    <>
      {reports && <SlicReportsNotice {...reports} />}
      {has('driverClaims') && <DriverClaimsNotice count={claims} disputes={disputes} />}
      {jobChanges && <JobChangesNotice {...jobChanges} />}
      {coverJobChanges && <CoverJobChangesNotice {...coverJobChanges} />}
      {links.length > 0 && <AdminLinks links={links} label={label} />}
    </>
  );
}
