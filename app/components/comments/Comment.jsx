import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import parse, { domToReact } from 'html-react-parser';
import { Box, Divider, Paper, Typography } from '@mui/material';

import CommentFooter from './CommentFooter';
import CommentHeader from './CommentHeader';

function Comment({ comment, refetchComments }) {
  const [author, setAuthor] = useState({});
  const { userId } = comment;
  const session = useSession();
  const user = session.data?.user;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch(`/api/users/${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch user');
        }
        const data = await response.json();
        setAuthor(data);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    fetchUser();
  }, [userId]);

  if (!author || Object.keys(author).length === 0) {
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
