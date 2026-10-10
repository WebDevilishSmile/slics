import { getSession } from '@/lib/authz';
import { Typography } from '@mui/material';

import { getAllSlics } from '@/lib/db/slics';

import CommentPrompt from '@/components/comments/CommentPrompt';
import InstallNudge from '@/components/install/InstallNudge';
import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicLookupPage from '@/components/slic/SlicLookupPage';

export default async function Home({ searchParams }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/'
      />
    );
  }

  const user = session.user;
  const slics = await getAllSlics();

  return (
    <SlicLookupPage
      searchParams={searchParams}
      slics={slics}
      user={user}
      heading={<Typography variant='h1'>SLICs</Typography>}
    >
      <InstallNudge />
      <CommentPrompt user={user} />
    </SlicLookupPage>
  );
}
