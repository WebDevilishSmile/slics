import { getCommentsByUserId } from '@/lib/db/comments';
import { getUserById } from '@/lib/db/users';
import { getSupporterSince } from '@/lib/db/bmcEvents';
import { getSlicViewsByUserId } from '@/lib/db/slicViews';
import { getAllSlics } from '@/lib/db/slics';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession, isSuperAdmin } from '@/lib/authz';
import { getClaimableDriverNames } from '@/lib/db/driverClaims';
import { displayName } from '@/lib/names';
import { Box, Link, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import {
  serializeSlicViews,
  serializeSlics,
  serializeComments,
  toHomeBase,
} from '@/lib/serializers';
import dayjs from 'dayjs';
import UserComments from '@/components/admin/users/UserComments';
import UserSlics from '@/components/admin/users/UserSlics';
import UserDriver from '@/components/admin/users/UserDriver';
import { composeEmailHref } from '@/components/admin/users/UserEmail';
import UserHomeBase from '@/components/admin/users/UserHomeBase';
import UserDangerZone from '@/components/admin/users/UserDangerZone';
import VerifiedBadge from '@/components/utility/VerifiedBadge';

async function UserPage({ params }) {
  const session = await getAreaSession('users');
  if (!session) return <NoAccess />;

  const { id } = await params;
  const user = await getUserById(id); // Assuming you have a function to get user by ID
  const userComments = await getCommentsByUserId(id); // Fetch comments by user ID
  const [userSlicViews, slics, supporterSince, sheetNames] = await Promise.all([
    getSlicViewsByUserId(id),
    getAllSlics(),
    user ? getSupporterSince(user._id).catch(() => null) : null,
    getClaimableDriverNames(),
  ]);

  if (!user) {
    return (
      <>
        <Typography variant='sectionHeading'>User Not Found</Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant='sectionHeading'>User Details</Typography>

      <Paper variant='panel' sx={{ minHeight: 0, gap: 0.5 }}>
        <Box
          sx={{ position: 'relative', width: '6rem', height: '6rem', mb: 1.5 }}
        >
          <Image
            src={user.image || '/default-avatar.png'}
            alt={`${displayName(user.name)}'s avatar`}
            fill
            style={{ objectFit: 'cover', borderRadius: '50%' }}
          />
        </Box>

        <Typography variant='h5'>
          {displayName(user.name)}
          {user.driver?.verifiedAt && <VerifiedBadge />}
        </Typography>
        {/* The super admin writes to them from the app's compose page. */}
        <Typography variant='subtitle1'>
          Email:{' '}
          {isSuperAdmin(session) && user.email ? (
            <Link href={composeEmailHref(user.email)}>{user.email}</Link>
          ) : (
            user.email
          )}
        </Typography>
        <Typography variant='subtitle1'>Role: {user.role}</Typography>
        <Typography variant='subtitle1'>
          Joined: {dayjs(user.created_at).format('MMMM D, YYYY')}
        </Typography>
        <Typography variant='subtitle1'>
          BuyMeACoffee:{' '}
          <strong>{user.bmcMember ? 'Member' : 'Not a member'}</strong>
        </Typography>
        {supporterSince && (
          <Typography variant='subtitle1'>
            Supporter since {dayjs(supporterSince).format('MMMM YYYY')}
          </Typography>
        )}

        <UserDriver
          userId={user._id.toString()}
          accountName={displayName(user.name ?? '')}
          initial={{
            driverVerified: Boolean(user.driver?.verifiedAt),
            driverName: user.driver?.name ?? null,
            verifiedAt: user.driver?.verifiedAt ?? null,
            verifiedBy: user.driver?.verifiedBy?.name ?? null,
          }}
          names={sheetNames}
        />

        {/* Where they work out of, and a change they asked for
            (docs/MULTI-HUB.md "Home base", step 4). */}
        <UserHomeBase
          userId={user._id.toString()}
          name={displayName(user.name ?? '')}
          initial={{ homeBase: toHomeBase(user.homeBase), homeBaseRequest: toHomeBase(user.homeBaseRequest) }}
          driverName={user.driver?.verifiedAt ? displayName(user.driver.name ?? '') : null}
        />

        {/* Deleting the account: the super admin only, never their own or
            another super admin's (docs/ADMIN-USER-DELETION.md). */}
        {isSuperAdmin(session) &&
          user.superAdmin !== true &&
          user._id.toString() !== session.user.id && (
            <UserDangerZone
              userId={user._id.toString()}
              name={displayName(user.name ?? '')}
              email={user.email ?? ''}
              role={user.role ?? 'user'}
              commentCount={userComments.length}
              viewCount={userSlicViews.length}
            />
          )}
      </Paper>

      <UserSlics
        userSlicViews={serializeSlicViews(userSlicViews)}
        slics={serializeSlics(slics)}
      />

      <UserComments userComments={serializeComments(userComments)} />
    </>
  );
}

export default UserPage;
