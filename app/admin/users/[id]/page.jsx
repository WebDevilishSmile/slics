import { getCommentsByUserId } from '@/lib/db/comments';
import { getUserById } from '@/lib/db/users';
import { getSlicViewsByUserId } from '@/lib/db/slicViews';
import { getAllSlics } from '@/lib/db/slics';
import { Box, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import {
  serializeSlicViews,
  serializeSlics,
  serializeComments,
  serializeUser,
} from '@/utils/functions';
import dayjs from 'dayjs';
import UserComments from '@/app/components/admin/user-page/UserComments';
import UserSlics from '@/app/components/admin/user-page/UserSlics';

async function UserPage({ params }) {
  const { id } = await params;
  const user = await getUserById(id); // Assuming you have a function to get user by ID
  const userComments = await getCommentsByUserId(id); // Fetch comments by user ID
  const [userSlicViews, slics] = await Promise.all([
    getSlicViewsByUserId(id),
    getAllSlics(),
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

        <Typography variant='h5'>{user.name}</Typography>
        <Typography variant='subtitle1'>Email: {user.email}</Typography>
        <Typography variant='subtitle1'>Role: {user.role}</Typography>
        <Typography variant='subtitle1'>
          Joined: {dayjs(user.created_at).format('MMMM D, YYYY')}
        </Typography>
        <Typography variant='subtitle1'>
          BuyMeACoffee:{' '}
          <strong>{user.bmcMember ? 'Member' : 'Not a member'}</strong>
        </Typography>
      </Paper>

      <UserSlics
        userSlicViews={serializeSlicViews(userSlicViews)}
        slics={serializeSlics(slics)}
      />

      <UserComments
        userComments={serializeComments(userComments)}
        user={serializeUser(user)}
      />
    </>
  );
}

export default UserPage;
