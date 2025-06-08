import { Box, Typography } from '@mui/material';
import dayjs from 'dayjs';

function CommentFoot({ comment }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant='caption'>
        {dayjs(comment.created_at).format('MMM D, YYYY @ h:mm A')}
      </Typography>

      <Typography variant='caption'>
        UpVotes: {comment.upVotes.length || 0} | DownVotes:{' '}
        {comment.downVotes.length || 0}
      </Typography>
    </Box>
  );
}

export default CommentFoot;
