import SlicForm from '@/components/slicForm/SlicForm';
import { Typography } from '@mui/material';
import { getAdminSession } from '@/lib/authz';

async function NewSlicPage() {
  if (!(await getAdminSession())) return null;

  return (
    <>
      <Typography variant='sectionHeading'>New SLIC</Typography>

      <SlicForm />
    </>
  );
}

export default NewSlicPage;
