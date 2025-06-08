import SlicForm from '@/app/components/createEditSlic/SlicForm';
import BackButton from '@/app/components/layout/BackButton';
import { serializeSlic } from '@/utils/functions';
import { getSlicByNumSlic } from '@/utils/slicsApi';
import { Typography } from '@mui/material';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);

  return (
    <>
      <BackButton />
      <Typography variant='h2' sx={{ maxWidth: '40rem', textAlign: 'center' }}>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>

      <SlicForm initialData={serializeSlic(slicData)} mode='edit' />
    </>
  );
}

export default EditPage;
