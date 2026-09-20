import SlicForm from '@/app/components/slicForm/SlicForm';
import BackButton from '@/app/components/layout/BackButton';
import { Typography } from '@mui/material';

async function NewSlicPage() {
  return (
    <>
      <BackButton />
      <Typography variant='sectionHeading'>New Slic</Typography>

      <SlicForm />
    </>
  );
}

export default NewSlicPage;
