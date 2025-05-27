import BackButton from '@/app/components/layout/BackButton';
import PageContainer from '@/app/components/layout/PageContainer';
import { getSlicByNumSlic } from '@/utils/slicsApi';
import { Typography } from '@mui/material';

async function EditPage({ params }) {
  const { slic } = await params;
  const slicData = await getSlicByNumSlic(slic);

  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2' sx={{ maxWidth: '40rem', textAlign: 'center' }}>
        Edit {slicData.name || slicData.alphaSlic}
      </Typography>
    </PageContainer>
  );
}

export default EditPage;
