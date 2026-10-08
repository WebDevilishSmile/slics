import { Paper } from '@mui/material';
import CommentsDisplay from './CommentsDisplay';

function CommentsSection({ comments, slics, users }) {
  return (
    <Paper
      variant='panel'
      sx={{ alignItems: 'stretch', minHeight: 0, px: { xs: 2, sm: 3 } }}
    >
      <CommentsDisplay comments={comments} slics={slics} users={users} />
    </Paper>
  );
}

export default CommentsSection;
