import { Box, Typography } from '@mui/material';
import CommentEditor from './CommentEditor';
import CommentsContainer from './CommentsContainer';

function Comments() {
  const comments = [];

  return (
    <CommentsContainer>
      {comments.length > 0 ? (
        comments.map((comment) => (
          <Box key={comment.id}>
            {/* Render each comment here */}
            <Typography>{comment.content}</Typography>
          </Box>
        ))
      ) : (
        <>
          <Typography sx={{ mt: '1.6rem' }}>
            Be the first to post a comment!
          </Typography>
          <Typography sx={{ mt: '1.6rem' }}>
            Click the plus icon to add a comment.
          </Typography>
        </>
      )}
    </CommentsContainer>
  );
}

export default Comments;
