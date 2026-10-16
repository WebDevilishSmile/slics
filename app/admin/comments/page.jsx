import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession } from '@/lib/authz';
import { getAllSlics } from '@/lib/db/slics';

import CommentsSection from '@/components/admin/comments/CommentsSection';
import LoadingFallback from '@/components/layout/LoadingFallback';
import { getAllComments } from '@/lib/db/comments';
import { serializeComments, serializeSlics, toPublicUser } from '@/lib/serializers';
import { getUsers } from '@/lib/db/users';
import { Typography } from '@mui/material';
import { Suspense } from 'react';
import HydrationGuard from '@/components/utility/HydrationGuard';

async function CommentsPage() {
  // app/admin/layout.jsx shows everyone else the redirect message.
  if (!(await getAreaSession('comments'))) return <NoAccess />;

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
          users={users.map(toPublicUser)}
        />
      </HydrationGuard>
    </Suspense>
  );
}

export default CommentsPage;
