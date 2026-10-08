import { auth } from '@/auth';
import { getCommentsByUserId } from '@/lib/db/comments';
import { getUserById } from '@/lib/db/users';
import { serializeComments, serializeUser } from '@/lib/serializers';

import RedirectMessage from '@/components/layout/RedirectMessage';
import ProfileComments from '@/components/profile/ProfileComments';
import ProfileData from '@/components/profile/ProfileData';
import HydrationGuard from '@/components/utility/HydrationGuard';
import PageContainer from '@/components/layout/PageContainer';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import LoadingFallback from '@/components/layout/LoadingFallback';

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

        <HydrationGuard>
          <ProfileData
            userData={serializeUser(userData)}
            commentCount={comments.length}
          />
          <ProfileComments comments={serializeComments(comments)} />
        </HydrationGuard>
      </PageContainer>
    </Suspense>
  );
}

export default ProfilePage;
