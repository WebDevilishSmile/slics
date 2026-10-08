import { auth } from '@/auth';
import { getAllSlics } from '@/lib/db/slics';

import CommentsSection from '@/app/components/admin/comments/CommentsSection';
import RedirectMessage from '@/app/components/layout/RedirectMessage';
import LoadingFallback from '@/app/components/layout/LoadingFallback';
import { getAllComments } from '@/lib/db/comments';
import {
  serializeComments,
  serializeSlics,
  serializeUsers,
} from '@/utils/functions';
import { getUsers } from '@/lib/db/users';
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

  const comments = await getAllComments();

  if (!comments) {
    return <Typography>No comments found.</Typography>;
  }

  const slics = await getAllSlics();
  const users = await getUsers();

  return (
    <Suspense fallback={<LoadingFallback />}>
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
