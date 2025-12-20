import { Paper } from '@mui/material';
import CommentsDisplay from './CommentsDisplay';

function CommentsSection({ comments, slics, users }) {
  return (
    <Paper
      sx={{
        width: { md: '90%', xs: '100%' },
        maxWidth: '32rem',
        minHeight: '40rem',
        px: '1rem',
        py: '2rem',
      }}
    >
      <CommentsDisplay comments={comments} slics={slics} users={users} />
    </Paper>
  );
}

export default CommentsSection;
