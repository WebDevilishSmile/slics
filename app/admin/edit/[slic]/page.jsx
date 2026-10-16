import {
  serializeSlic,
  serializeSlicHistory,
  withNamedStamps,
  withNamedUser,
} from '@/lib/serializers';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { getSlicHistory } from '@/lib/db/slicHistory';
import { getOpenSlicReport } from '@/lib/db/slicReports';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession, hasArea } from '@/lib/authz';

import SlicForm from '@/components/slicForm/SlicForm';
import SlicAuditInfo from '@/components/slicForm/SlicAuditInfo';
import SlicHistoryList from '@/components/slicForm/SlicHistoryList';
import ReportBeingFixed from '@/components/admin/slicReports/ReportBeingFixed';
import { Typography } from '@mui/material';

// `?report=<id>`: opened from a driver report's Fix (/admin/reports). Saving
// then resolves that report. Only for someone with the SLIC reports area
// too: a dispatcher with SLICs alone edits without it (docs/STAFF-ROLES.md).
async function EditPage({ params, searchParams }) {
  const session = await getAreaSession('slics');
  if (!session) return <NoAccess />;

  const { slic } = await params;
  const { report: reportId } = await searchParams;
  const [slicData, history, report] = await Promise.all([
    getSlicByNumSlic(slic),
    getSlicHistory(slic),
    reportId && hasArea(session, 'reports') ? getOpenSlicReport(reportId, slic) : null,
  ]);

  // Editors by name only for anyone but an admin (lib/serializers.js).
  const admin = session.user.role === 'admin';
  const slicProps = admin ? serializeSlic(slicData) : withNamedStamps(serializeSlic(slicData));
  const historyProps = admin
    ? serializeSlicHistory(history)
    : serializeSlicHistory(history).map(withNamedUser);

  return (
    <>
      <Typography variant='sectionHeading'>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>

      {report && <ReportBeingFixed report={report} />}
      <SlicAuditInfo slic={slicProps} />
      <SlicForm initialData={slicProps} mode='edit' reportId={report?._id} />
      <SlicHistoryList history={historyProps} />
    </>
  );
}

export default EditPage;
