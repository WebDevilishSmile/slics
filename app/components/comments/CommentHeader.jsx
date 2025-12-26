'use client';

import { ThumbDown, ThumbUp } from '@mui/icons-material';
import { Avatar, Box, IconButton, Typography } from '@mui/material';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

function CommentHeader({ author, comment, refetchComments }) {
  const user = useSession().data?.user;
  const pathname = usePathname();

  const handleVote = async (commentId, type) => {
    const res = await fetch(`/api/comments/${commentId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ voteType: type }), // "up" or "down"
    });

    if (res.ok) {
      // Re-fetch or optimistically update the comment state
      refetchComments();
    }
  };

  console.log(author);

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        py: '.25rem',
        px: '.5rem',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <Avatar src={author.image} sx={{ width: '2rem', height: '2rem' }} />
        <Typography>{author?.name?.split(' ').at(0)}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Typography
          sx={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}
        >
          <IconButton
            onClick={() => handleVote(comment._id, 'up')}
            disabled={
              comment.upVotes.includes(user?.id) ||
              pathname.startsWith('/admin/users')
            }
          >
            <ThumbUp sx={{ fontSize: '1rem' }} />{' '}
          </IconButton>
          {comment.upVotes.length || 0}
        </Typography>
        <Typography
          sx={{ display: 'flex', gap: '.25rem', alignItems: 'center' }}
        >
          <IconButton
            onClick={() => handleVote(comment._id, 'down')}
            disabled={
              comment.downVotes.includes(user?.id) ||
              pathname.startsWith('/admin/users')
            }
          >
            <ThumbDown sx={{ fontSize: '1rem' }} />{' '}
          </IconButton>
          {comment.downVotes.length || 0}
        </Typography>
      </Box>
    </Box>
  );
}

export default CommentHeader;
