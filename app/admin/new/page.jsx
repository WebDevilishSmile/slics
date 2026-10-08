import SlicForm from '@/app/components/slicForm/SlicForm';
import { Typography } from '@mui/material';

async function NewSlicPage() {
  return (
    <>
      <Typography variant='sectionHeading'>New SLIC</Typography>

      <SlicForm />
    </>
  );
}

export default NewSlicPage;
