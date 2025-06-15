import { serializeSlic } from '@/utils/functions';
import { getSlicByNumSlic } from '@/utils/slicsApi';

import SlicForm from '@/app/components/createEditSlic/SlicForm';
import BackButton from '@/app/components/layout/BackButton';
import StyledHeading from '@/app/components/layout/StyledHeading';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);

  return (
    <>
      <BackButton />
      <StyledHeading heading='h3'>
        Edit {slicData.name || slicData.alphaSlic}
      </StyledHeading>

      <SlicForm initialData={serializeSlic(slicData)} mode='edit' />
    </>
  );
}

export default EditPage;
