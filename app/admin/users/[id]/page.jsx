import { getCommentsByUserId } from '@/utils/commentsApi';
import { getUserById } from '@/utils/usersApi';
import { getSlicViewsByUserId } from '@/utils/slicViewsApi';
import { getAllSlics } from '@/utils/slicsApi';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import parse, { domToReact } from 'html-react-parser';
import Comment from '@/app/components/comments/Comment';
import {
  serializeSlicViews,
  serializeSlics,
  serializeComments,
  serializeUser,
} from '@/utils/functions';
import { MAX_WIDTH } from '@/utils/variables';
import dayjs from 'dayjs';
import UserComments from '@/app/components/admin/user-page/UserComments';
import UserSlics from '@/app/components/admin/user-page/UserSlics';
import BackButton from '@/app/components/layout/BackButton';

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
        <Typography variant='h2'>User Not Found</Typography>
      </>
    );
  }

  return (
    <>
      <BackButton />
      <Typography variant='h2'>User Details</Typography>

      <Box sx={{ position: 'relative', width: '6rem', height: '6rem', my: 2 }}>
        <Image
          src={user.image}
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
