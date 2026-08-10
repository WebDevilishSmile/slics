import { serializeSlic, serializeSlicHistory } from '@/utils/functions';
import { getSlicByNumSlic } from '@/utils/slicsApi';
import { getSlicHistory } from '@/utils/slicHistoryApi';

import SlicForm from '@/app/components/createEditSlic/SlicForm';
import SlicAuditInfo from '@/app/components/createEditSlic/SlicAuditInfo';
import SlicHistoryList from '@/app/components/createEditSlic/SlicHistoryList';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);
  const history = await getSlicHistory(slic);

  return (
    <>
      <BackButton />
      <StyledHeading heading='h3'>
        Edit {slicData.name || slicData.alphaSlic}
      </StyledHeading>

      <SlicAuditInfo slic={serializeSlic(slicData)} />
      <SlicForm initialData={serializeSlic(slicData)} mode='edit' />
      <SlicHistoryList history={serializeSlicHistory(history)} />
    </>
  );
}

export default EditPage;
