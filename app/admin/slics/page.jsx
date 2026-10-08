import { auth } from '@/auth';
import { serializeSlics } from '@/utils/functions';
import { getAllSlics } from '@/lib/db/slics';

import RedirectMessage from '@/app/components/layout/RedirectMessage';
import { Typography } from '@mui/material';
import SlicsTable from '../../components/admin/slics/SlicsTable';

async function SlicsTablePage() {
  const session = await auth();

  if (!session) {
    // If the user is not authenticated, redirect them to the sign-in page
    return (
      <RedirectMessage
        heading='You must be logged in to access this page.'
        subheading='Please sign in to continue.'
        redirect='/'
      />
    );
  }
  const user = session.user;
  const isAdmin = user && user.role === 'admin';
  if (!isAdmin) {
    // If the user is not authenticated or not an admin, redirect them
    return (
      <RedirectMessage
        message='You must be an admin to access this page.'
        redirect='/home'
      />
    );
  }
  const slics = await getAllSlics();

  return (
    <>
      <Typography variant='sectionHeading'>SLICs</Typography>

      <SlicsTable slics={serializeSlics(slics)} />
    </>
  );
}

export default SlicsTablePage;
