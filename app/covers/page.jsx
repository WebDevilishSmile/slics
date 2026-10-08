import { auth } from '@/auth';
import { getDriverById } from '@/lib/db/drivers';
import { serializeDriver, serializeUser } from '@/utils/functions';
import { getUserById } from '@/lib/db/users';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import LoadingFallback from '@/app/components/layout/LoadingFallback';
import CoversDate from '../components/covers/CoversDate';
import PageContainer from '../components/layout/PageContainer';
import RedirectMessage from '../components/layout/RedirectMessage';
import HydrationGuard from '../components/utility/HydrationGuard';

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
        heading='You do not have permission to view this profile.'
        subheading='Please check the user ID and try again.'
        redirect='/'
      />
    );
  }
  const driverData = await getDriverById(userData.driverId);

  if (userData.driverId !== driverData._id.toString()) {
    return (
      <RedirectMessage
        heading='You do not have permission to view this profile.'
        subheading='Please check the user ID and try again.'
        redirect='/'
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
