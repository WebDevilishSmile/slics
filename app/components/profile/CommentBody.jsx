import { Box } from '@mui/material';
import CommentContent from '../comments/CommentContent';

// Plain-text tips and older HTML comments both render through CommentContent.
function CommentBody({ comment }) {
  return (
    <Box sx={{ minHeight: '5rem', py: 2, px: 2 }}>
      <CommentContent comment={comment} />
    </Box>
  );
}

export default CommentBody;
