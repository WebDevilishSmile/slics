import { Typography } from '@mui/material';

import BackButton from '@/app/components/layout/BackButton';
import PageContainer from '@/app/components/layout/PageContainer';
import NewSlicForm from '@/app/components/newSlic/NewSlicForm';
import SlicForm from '@/app/components/createEditSlic/SlicForm';

async function NewSlicPage() {
  return (
    <>
      <BackButton />
      <Typography variant='h2'>New Slic</Typography>

      <SlicForm />
      {/* <NewSlicForm /> */}
    </>
  );
}

export default NewSlicPage;
