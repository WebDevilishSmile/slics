import { serializeSlic, serializeSlicHistory } from '@/lib/serializers';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { getSlicHistory } from '@/lib/db/slicHistory';
import { getOpenSlicReport } from '@/lib/db/slicReports';

import SlicForm from '@/components/slicForm/SlicForm';
import SlicAuditInfo from '@/components/slicForm/SlicAuditInfo';
import SlicHistoryList from '@/components/slicForm/SlicHistoryList';
import ReportBeingFixed from '@/components/admin/slicReports/ReportBeingFixed';
import { Typography } from '@mui/material';

// `?report=<id>`: opened from a driver report's Fix (/admin/reports). Saving
// then resolves that report.
async function EditPage({ params, searchParams }) {
  const { slic } = await params;
  const { report: reportId } = await searchParams;
  const [slicData, history, report] = await Promise.all([
    getSlicByNumSlic(slic),
    getSlicHistory(slic),
    reportId ? getOpenSlicReport(reportId, slic) : null,
  ]);

  return (
    <>
      <Typography variant='sectionHeading'>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>

      {report && <ReportBeingFixed report={report} />}
      <SlicAuditInfo slic={serializeSlic(slicData)} />
      <SlicForm initialData={serializeSlic(slicData)} mode='edit' reportId={report?._id} />
      <SlicHistoryList history={serializeSlicHistory(history)} />
    </>
  );
}

export default EditPage;
