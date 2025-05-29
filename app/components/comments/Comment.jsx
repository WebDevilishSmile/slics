import { Avatar, Box, Divider, Paper, Typography } from '@mui/material';
import parse, { domToReact } from 'html-react-parser';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import CommentFooter from './CommentFooter';

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

  console.log(author.image);

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
      <Box
        sx={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          py: '.25rem',
          px: '.5rem',
        }}
      >
        {/* COMMENT HEADER */}
        <Avatar src={author.image} sx={{ width: '2rem', height: '2rem' }} />
        <Typography>
          {author?.name?.split(' ').at(0)} - {author?.email}
        </Typography>
      </Box>

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
