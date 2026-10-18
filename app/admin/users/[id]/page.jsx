import { getCommentsByUserId } from '@/lib/db/comments';
import { getUserById } from '@/lib/db/users';
import { getSupporterSince } from '@/lib/db/bmcEvents';
import { getSlicViewsByUserId } from '@/lib/db/slicViews';
import { getAllSlics } from '@/lib/db/slics';
import NoAccess from '@/components/admin/NoAccess';
import { getAreaSession, isSuperAdmin } from '@/lib/authz';
import { getClaimableDriverNames } from '@/lib/db/driverClaims';
import { getFeatures, getRoleAreas } from '@/lib/db/appSettings';
import { areasFor } from '@/lib/staffAreas';
import { Box, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import {
  serializeSlicViews,
  serializeSlics,
  serializeComments,
  toCoversAccess,
} from '@/lib/serializers';
import dayjs from 'dayjs';
import UserComments from '@/components/admin/users/UserComments';
import UserSlics from '@/components/admin/users/UserSlics';
import UserCoversAccess from '@/components/admin/users/UserCoversAccess';
import UserDriver from '@/components/admin/users/UserDriver';
import VerifiedBadge from '@/components/utility/VerifiedBadge';

async function UserPage({ params }) {
  const session = await getAreaSession('users');
  if (!session) return <NoAccess />;

  const { id } = await params;
  const user = await getUserById(id); // Assuming you have a function to get user by ID
  const userComments = await getCommentsByUserId(id); // Fetch comments by user ID
  const [userSlicViews, slics, supporterSince, sheetNames, roleAreas, features] = await Promise.all([
    getSlicViewsByUserId(id),
    getAllSlics(),
    user ? getSupporterSince(user._id).catch(() => null) : null,
    getClaimableDriverNames(),
    getRoleAreas(),
    getFeatures(),
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
            alt={`${user.name}'s avatar`}
            fill
            style={{ objectFit: 'cover', borderRadius: '50%' }}
          />
        </Box>

        <Typography variant='h5'>
          {user.name}
          {user.driver?.verifiedAt && <VerifiedBadge />}
        </Typography>
        <Typography variant='subtitle1'>Email: {user.email}</Typography>
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

        {/* Covers early access: only a super admin switches it, like the
            "Covers for every driver" switch (docs/COVER-BIDDING.md). */}
        <UserCoversAccess
          framed
          userId={user._id.toString()}
          name={user.name ?? ''}
          initial={toCoversAccess(user)}
          byRole={areasFor(user, roleAreas).includes('covers')}
          coversOpen={features.coversOpen}
          canChange={isSuperAdmin(session)}
        />

        <UserDriver
          userId={user._id.toString()}
          accountName={user.name ?? ''}
          initial={{
            driverVerified: Boolean(user.driver?.verifiedAt),
            driverName: user.driver?.name ?? null,
            verifiedAt: user.driver?.verifiedAt ?? null,
            verifiedBy: user.driver?.verifiedBy?.name ?? null,
          }}
          names={sheetNames}
        />
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
