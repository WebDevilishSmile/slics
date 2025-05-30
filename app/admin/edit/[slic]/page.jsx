import { getSlicByNumSlic } from '@/utils/slicsApi';
import { serializeSlic } from '@/utils/functions';
import { Typography } from '@mui/material';
import SlicForm from '@/app/components/createEditSlic/SlicForm';
import BackButton from '@/app/components/layout/BackButton';
import PageContainer from '@/app/components/layout/PageContainer';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2' sx={{ maxWidth: '40rem', textAlign: 'center' }}>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>

      <SlicForm initialData={serializeSlic(slicData)} mode='edit' />
    </PageContainer>
  );
}

export default EditPage;
