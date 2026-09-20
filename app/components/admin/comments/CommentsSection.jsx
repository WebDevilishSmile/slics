import theme from '@/utils/theme';
import { Paper } from '@mui/material';
import CommentsDisplay from './CommentsDisplay';

function CommentsSection({ comments, slics, users }) {
  return (
    <Paper
      sx={{
        width: { md: '90%', xs: '100%' },
        maxWidth: theme.layout.width.panel,
        minHeight: '40rem',
        px: 2,
        py: 4,
      }}
    >
      <CommentsDisplay comments={comments} slics={slics} users={users} />
    </Paper>
  );
}

export default CommentsSection;
