import { Box, Button, Typography } from '@mui/material';

function CommentHeader({ comment }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mb: 1,
      }}
    >
      <Typography variant='h6'>{comment.numSlic}</Typography>

      <Button
        variant='outlined'
        size='small'
        href={`/home?slic=${comment.numSlic}`}
      >
        View SLIC
      </Button>
    </Box>
  );
}

export default CommentHeader;
