import { Paper } from '@mui/material';
import theme from '@/utils/theme';

import CommentHeader from './CommentHeader';
import CommentBody from './CommentBody';
import CommentFoot from './CommentFoot';
import CommentDelete from './CommentDelete';
import { serializeComment } from '@/utils/functions';
import HydrationGuard from '../utility/HydrationGuard';
import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';

function ProfileComments({ comments }) {
  return (
    <CommentRefreshProvider>
      <>
        {comments.map((comment) => (
          <Paper
            key={comment._id}
            elevation={theme.layout.elevation}
            sx={{
              maxWidth: theme.layout.maxWidth,
              width: '100%',
              mt: 2,
              p: 2,
              boxShadow: 1,
            }}
          >
            <CommentHeader comment={comment} />
            <CommentBody comment={comment} />
            <CommentFoot comment={comment} />
              <CommentDelete comment={serializeComment(comment)} />
          </Paper>
        ))}
      </>
    </CommentRefreshProvider>
  );
}

export default ProfileComments;
