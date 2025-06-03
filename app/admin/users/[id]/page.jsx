import { getCommentsByUserId } from '@/utils/commentsApi';
import { getUserById } from '@/utils/usersApi';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import parse, { domToReact } from 'html-react-parser';
import Comment from '@/app/components/comments/Comment';
import { serializeComment } from '@/utils/functions';
import { MAX_WIDTH } from '@/utils/variables';
import dayjs from 'dayjs';

async function UserPage({ params }) {
  const { id } = await params;
  const user = await getUserById(id); // Assuming you have a function to get user by ID
  const userComments = await getCommentsByUserId(id); // Fetch comments by user ID

  if (!user) {
    return (
      <>
        <Typography variant='h2'>User Not Found</Typography>
      </>
    );
  }

  return (
    <>
      <Typography variant='h2'>User Details</Typography>

      <Box
        sx={{ position: 'relative', width: '6rem', height: '6rem', my: '1rem' }}
      >
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

      <Typography variant='h6' sx={{ mt: '2rem' }}>
        Comments by {user.name}:
      </Typography>

      <Box
        sx={{
          width: '100%',
          maxWidth: MAX_WIDTH,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          mt: '1rem',
        }}
      >
        {userComments.length > 0 ? (
          userComments.map((comment) => (
            <Comment key={comment._id} comment={serializeComment(comment)} />
          ))
        ) : (
          <Typography variant='body2'>
            No comments found for this user.
          </Typography>
        )}
      </Box>
    </>
  );
}

export default UserPage;
