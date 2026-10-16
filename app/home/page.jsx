import { areasOf, getSession } from '@/lib/authz';
import { STAFF_ROLES } from '@/constants';
import { Typography } from '@mui/material';

import { ObjectId } from 'mongodb';

import { getUnthankedSupport } from '@/lib/db/bmcEvents';
import { getAllSlics } from '@/lib/db/slics';
import { getRoleNotice, isIconNoticeDue } from '@/lib/db/users';

import CommentPrompt from '@/components/comments/CommentPrompt';
import InstallNudge from '@/components/install/InstallNudge';
import NewIconNotice from '@/components/install/NewIconNotice';
import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicLookupPage from '@/components/slic/SlicLookupPage';
import WelcomeCard from '@/components/staff/WelcomeCard';
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

// Whether the "new app icon" notice is still due (install/NewIconNotice.jsx).
// Never worth failing the lookup page over either.
async function iconNoticeDue(userId) {
  try {
    return await isIconNoticeDue(userId);
  } catch (error) {
    console.error('Error loading icon notice for /home:', error);
    return false;
  }
}

// The welcome note waiting for someone just made an admin or a dispatcher
// (staff/WelcomeCard.jsx). Never worth failing the lookup page over.
async function roleNotice(userId) {
  try {
    return await getRoleNotice(userId);
  } catch (error) {
    console.error('Error loading the welcome note for /home:', error);
    return null;
  }
}

export default async function Home({ searchParams }) {
  const session = await getSession();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/sign-in'
      />
    );
  }

  const user = session.user;
  const firstName = user.name?.split(' ')[0];
  const [slics, support, iconDue, welcome] = await Promise.all([
    getAllSlics(),
    unthankedSupport(user.id),
    iconNoticeDue(user.id),
    // Only staff can have one, so a driver's /home doesn't ask.
    STAFF_ROLES.includes(user.role) ? roleNotice(user.id) : null,
  ]);

  return (
    <SlicLookupPage
      searchParams={searchParams}
      slics={slics}
      user={user}
      heading={<Typography variant='h1'>SLICs</Typography>}
    >
      {welcome && <WelcomeCard notice={welcome} areas={areasOf(session)} firstName={firstName} />}
      {support && <SupportThanks support={support} firstName={firstName} />}
      <InstallNudge />
      <NewIconNotice due={iconDue} />
      <CommentPrompt user={user} />
    </SlicLookupPage>
  );
}
