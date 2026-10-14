import { canUseCovers, canUsePush, getSession, isSuperAdmin } from '@/lib/authz';
import { getCommentsByUserId } from '@/lib/db/comments';
import { getPushPrefs, getUserById, userHasPassword } from '@/lib/db/users';
import { getSupporterSince } from '@/lib/db/bmcEvents';
import { serializeComments, toSelfUser } from '@/lib/serializers';

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

  const session = await getSession();
  if (!session) {
    return (
      <RedirectMessage
        heading='You must be signed in to view this page.'
        subheading='Please sign in and try again.'
        redirect='/sign-in'
      />
    );
  }

  // Only your own profile, matched by id, not email (docs/SECURITY.md #19).
  const userData = id === session.user.id ? await getUserById(id) : null;
  if (!userData) {
    return (
      <RedirectMessage
        heading='You do not have permission to view this profile.'
        subheading='Please check the user ID and try again.'
        redirect='/'
      />
    );
  }

  const [comments, supporterSince, hasPassword, pushPrefs] = await Promise.all([
    getCommentsByUserId(id),
    // A failure only hides the line.
    getSupporterSince(userData._id).catch(() => null),
    // Puts "Change password" in Edit profile; only the flag, never the hash.
    userHasPassword(id),
    // The kinds of notification this account gets (docs/PUSH-NOTIFICATIONS.md,
    // stages 1b and 2). A failure only hides the switches.
    canUsePush(session)
      ? getPushPrefs(id, {
          admin: session.user.role === 'admin',
          superAdmin: isSuperAdmin(session),
        }).catch(() => null)
      : null,
  ]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageContainer>
        <Typography variant='sectionHeading'>Profile</Typography>

        <HydrationGuard>
          <ProfileData
            userData={{ ...toSelfUser(userData), hasPassword }}
            commentCount={comments.length}
            supporterSince={supporterSince}
            pushPrefs={pushPrefs}
            canUseCovers={canUseCovers(session)}
            canUsePush={canUsePush(session)}
          />
          <ProfileComments comments={serializeComments(comments)} />
        </HydrationGuard>
      </PageContainer>
    </Suspense>
  );
}

export default ProfilePage;
