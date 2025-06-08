import { auth } from '@/auth';
import { getCommentsByUserId } from '@/utils/commentsApi';
import { getUserById } from '@/utils/usersApi';
import { ELEVATION, MAX_WIDTH } from '@/utils/variables';
import { Paper, Typography } from '@mui/material';

import RedirectMessage from '@/app/components/layout/RedirectMessage';
import CommentBody from '@/app/components/profile/CommentBody';
import CommentFoot from '@/app/components/profile/CommentFoot';
import CommentHeader from '@/app/components/profile/CommentHeader';
import ProfileImage from '@/app/components/profile/ProfileImage';
import PageContainer from '../../components/layout/PageContainer';
import StyledHeading from '../../components/layout/StyledHeading';
import ProfileData from '@/app/components/profile/ProfileData';
import { serializeUser } from '@/utils/functions';

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
    <PageContainer>
      <StyledHeading>Profile</StyledHeading>

      <ProfileImage userData={userData} />
      <ProfileData userData={serializeUser(userData)} />

      {comments.map((comment) => (
        <Paper
          key={comment._id}
          elevation={ELEVATION}
          sx={{
            maxWidth: MAX_WIDTH,
            width: '100%',
            mt: 2,
            p: 2,
            borderRadius: '8px',
            boxShadow: 1,
          }}
        >
          <CommentHeader comment={comment} />
          <CommentBody comment={comment} />
          <CommentFoot comment={comment} />
        </Paper>
      ))}
    </PageContainer>
  );
}

export default ProfilePage;
