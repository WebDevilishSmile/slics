import { auth } from '@/auth';
import { getAllSlics } from '@/utils/slicsApi';

import CommentsSection from '@/app/components/admin/comments/CommentsSection';
import BackButton from '@/app/components/layout/BackButton';
import LoadingFallback from '@/app/components/layout/LoadingFallback';
import { getAllComments } from '@/utils/commentsApi';
import {
  serializeComments,
  serializeSlics,
  serializeUsers,
} from '@/utils/functions';
import { getUsers } from '@/utils/usersApi';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import HydrationGuard from '@/app/components/utility/HydrationGuard';

async function CommentsPage() {
  const session = await auth();

  if (!session) {
    // If the user is not authenticated, redirect them to the sign-in page
    return (
      <RedirectMessage
        heading='You must be logged in to access this page.'
        subheading='Please sign in to continue.'
        redirect='/signin'
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

  const comments = await getAllComments();

  if (!comments) {
    return <Typography>No comments found.</Typography>;
  }

  const slics = await getAllSlics();
  const users = await getUsers();

  return (
    <Suspense fallback={<LoadingFallback />}>
      <BackButton />
      <Typography variant='sectionHeading'>Comments</Typography>

      <HydrationGuard>
        <CommentsSection
          comments={serializeComments(comments)}
          slics={serializeSlics(slics)}
          users={serializeUsers(users)}
        />
      </HydrationGuard>
    </Suspense>
  );
}

export default CommentsPage;
