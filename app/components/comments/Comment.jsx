'use client';

import { Box, Divider, Paper, Typography, useColorScheme } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';
import { useSession } from 'next-auth/react';
import theme from '@/utils/theme';

import CommentFooter from './CommentFooter';
import CommentHeader from './CommentHeader';
import { ELEVATION } from '@/utils/variables';

function Comment({ comment, author, refetchComments }) {
  const session = useSession();
  const user = session.data?.user;
  const { mode } = useColorScheme();

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
      className={`${
        mode === 'light' ? 'border-[#eaf8fe]' : 'border-[#050505]'
      }`}
      elevation={0}
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

      <Box sx={{ minHeight: '5rem', py: '1rem', px: '1rem' }}>
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
        refetchComments={refetchComments}
      />
    </Paper>
  );
}

export default Comment;
