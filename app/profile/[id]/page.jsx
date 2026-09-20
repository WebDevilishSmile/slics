import { auth } from '@/auth';
import { getCommentsByUserId } from '@/utils/commentsApi';
import { getUserById } from '@/utils/usersApi';
import { serializeUser } from '@/utils/functions';

import HomeButton from '@/app/components/layout/HomeButton';
import RedirectMessage from '@/app/components/layout/RedirectMessage';
import DeleteAccount from '@/app/components/profile/DeleteAccount';
import ProfileComments from '@/app/components/profile/ProfileComments';
import ProfileData from '@/app/components/profile/ProfileData';
import ProfileImage from '@/app/components/profile/ProfileImage';
import HydrationGuard from '@/app/components/utility/HydrationGuard';
import PageContainer from '../../components/layout/PageContainer';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import LoadingFallback from '@/app/components/layout/LoadingFallback';

async function ProfilePage({ params }) {
  const { id } = await params;

  if (id.length !== 24) {
    return (
      <RedirectMessage
        heading='Profile Not Found'
        subheading='Please check the URL and try again.'
        redirect='/'
      />
    );
  }

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
  const userData = await getUserById(id);
  if (!userData || userData.email !== user.email) {
    return (
      <RedirectMessage
        heading='You do not have permission to view this profile.'
        subheading='Please check the user ID and try again.'
        redirect='/'
      />
    );
  }

  const comments = await getCommentsByUserId(id);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageContainer>
        <Typography variant='sectionHeading'>Profile</Typography>
        <HomeButton />

        <HydrationGuard>
          <ProfileImage userData={userData} />
          <ProfileData userData={serializeUser(userData)} />
          <ProfileComments comments={comments} />
          {userData.role !== 'admin' && (
            <DeleteAccount userId={id} commentCount={comments.length} />
          )}
        </HydrationGuard>
      </PageContainer>
    </Suspense>
  );
}

export default ProfilePage;
