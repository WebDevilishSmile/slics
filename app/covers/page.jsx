import { Suspense } from 'react';
import CoversDate from '../components/covers/CoversDate';
import BackButton from '../components/layout/BackButton';
import PageContainer from '../components/layout/PageContainer';
import StyledHeading from '../components/layout/StyledHeading';
import HydrationGuard from '../components/utility/HydrationGuard';
import { auth } from '@/auth';
import { getUserById } from '@/utils/usersApi';

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

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PageContainer>
        <BackButton />
        <StyledHeading>Covers</StyledHeading>

        <HydrationGuard>
          <CoversDate user={userData} />
        </HydrationGuard>
      </PageContainer>
    </Suspense>
  );
}

export default CoversPage;
