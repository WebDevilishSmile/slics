import { getSession } from '@/lib/authz';
import { Typography } from '@mui/material';

import { ObjectId } from 'mongodb';

import { getUnthankedSupport } from '@/lib/db/bmcEvents';
import { getAllSlics } from '@/lib/db/slics';

import CommentPrompt from '@/components/comments/CommentPrompt';
import InstallNudge from '@/components/install/InstallNudge';
import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicLookupPage from '@/components/slic/SlicLookupPage';
import SupportThanks from '@/components/support/SupportThanks';

// A thank-you waiting for this driver (docs/BMC-SUPPORT.md stage 3). Never
// worth failing the lookup page over.
async function unthankedSupport(userId) {
  try {
    return await getUnthankedSupport(new ObjectId(userId));
  } catch (error) {
    console.error('Error loading thank-you for /home:', error);
    return null;
  }
}

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
  const [slics, support] = await Promise.all([getAllSlics(), unthankedSupport(user.id)]);

  return (
    <SlicLookupPage
      searchParams={searchParams}
      slics={slics}
      user={user}
      heading={<Typography variant='h1'>SLICs</Typography>}
    >
      {support && <SupportThanks support={support} firstName={user.name?.split(' ')[0]} />}
      <InstallNudge />
      <CommentPrompt user={user} />
    </SlicLookupPage>
  );
}
