import SlicForm from '@/components/slicForm/SlicForm';
import { Typography } from '@mui/material';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';

async function NewSlicPage() {
  if (!(await getAreaSession('slics'))) return <NoAccess />;

  return (
    <>
      <Typography variant='sectionHeading'>New SLIC</Typography>

      <SlicForm />
    </>
  );
}

export default NewSlicPage;
