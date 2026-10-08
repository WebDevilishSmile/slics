import { serializeSlic, serializeSlicHistory } from '@/utils/functions';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { getSlicHistory } from '@/lib/db/slicHistory';

import SlicForm from '@/app/components/slicForm/SlicForm';
import SlicAuditInfo from '@/app/components/slicForm/SlicAuditInfo';
import SlicHistoryList from '@/app/components/slicForm/SlicHistoryList';
import { Typography } from '@mui/material';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);
  const history = await getSlicHistory(slic);

  return (
    <>
      <Typography variant='sectionHeading'>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>

      <SlicAuditInfo slic={serializeSlic(slicData)} />
      <SlicForm initialData={serializeSlic(slicData)} mode='edit' />
      <SlicHistoryList history={serializeSlicHistory(history)} />
    </>
  );
}

export default EditPage;
