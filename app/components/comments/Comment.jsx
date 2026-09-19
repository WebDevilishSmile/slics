'use client';

import { Box, Divider, Paper, Typography } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';
import { useSession } from 'next-auth/react';
import theme from '@/utils/theme';

import CommentFooter from './CommentFooter';
import CommentHeader from './CommentHeader';

function Comment({ comment, author, slicName, refetchComments }) {
  const session = useSession();
  const user = session.data?.user;

  if (!author) {
    return (
      <Paper
        sx={{
          width: '100%',
          minHeight: '7rem',
          mb: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography>Loading comment...</Typography>
      </Paper>
    );
  }

  return (
    <Paper
      elevation={1}
      sx={{
        width: '100%',
        minHeight: '7rem',
        mb: '1rem',
        overflow: 'hidden',
        bgcolor: 'background.comment',
      }}
    >
      <CommentHeader
        author={author}
        comment={comment}
        refetchComments={refetchComments}
      />

      <Divider />

      <Box className='comment-content' sx={{ minHeight: '5rem', py: 2, px: 2 }}>
        {/* COMMENT CONTENT */}

        {parse(comment.content, {
          replace: (domNode) => {
            if (domNode.name === 'p') {
              return <Typography>{domToReact(domNode.children)}</Typography>;
            }
          },
        })}
      </Box>

      <CommentFooter
        comment={comment}
        author={author}
        user={user}
        slicName={slicName}
        refetchComments={refetchComments}
      />
    </Paper>
  );
}

export default Comment;
