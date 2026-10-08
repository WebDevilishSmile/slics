import { auth } from '@/auth';
import { getDriverById } from '@/lib/db/drivers';
import { serializeDriver, serializeUser } from '@/lib/serializers';
import { getUserById } from '@/lib/db/users';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import LoadingFallback from '@/components/layout/LoadingFallback';
import CoversDate from '@/components/covers/CoversDate';
import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import HydrationGuard from '@/components/utility/HydrationGuard';

async function CoversPage() {
  const session = await auth();
  if (!session) {
    return (
      <RedirectMessage
        heading='You must be signed in to view this page.'
        subheading='Please sign in and try again.'
        redirect='/'
      />
    );
  }

  const user = session.user;
  const userData = await getUserById(user.id);
  if (!userData || userData.email !== user.email) {
    return (
      <RedirectMessage
        heading='We could not find your account.'
        subheading='Please sign in again.'
        redirect='/'
      />
    );
  }

  // Covers are per driver, so the account has to be linked to a row in
  // `drivers`. Most accounts aren't: getDriverById throws for a missing or
  // unknown id, which used to take the whole page down.
  let driverData = null;
  if (userData.driverId) {
    try {
      driverData = await getDriverById(userData.driverId);
    } catch {
      driverData = null;
    }
  }
  if (!driverData) {
    return (
      <RedirectMessage
        heading='Your account is not linked to a driver yet.'
        subheading='Covers show once it is. Taking you back to SLICs…'
        redirect='/home'
      />
    );
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageContainer>
        <Typography variant='sectionHeading'>Covers</Typography>

        <HydrationGuard>
          <CoversDate
            user={serializeUser(userData)}
            driver={serializeDriver(driverData)}
          />
        </HydrationGuard>
      </PageContainer>
    </Suspense>
  );
}

export default CoversPage;
