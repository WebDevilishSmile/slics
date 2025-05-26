import { Typography } from '@mui/material';

import BackButton from '@/app/components/layout/BackButton';
import PageContainer from '@/app/components/layout/PageContainer';
import NewSlicForm from '@/app/components/newSlic/NewSlicForm';

async function NewSlicPage() {
  return (
    <PageContainer>
      <BackButton />
      <Typography variant='h2'>New Slic</Typography>

      <NewSlicForm />
    </PageContainer>
  );
}

export default NewSlicPage;
