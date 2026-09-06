'use client';

import { ThumbDown, ThumbUp } from '@mui/icons-material';
import { Avatar, Box, IconButton, Tooltip, Typography } from '@mui/material';
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

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        py: 1,
        px: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar src={author.image} sx={{ width: '2rem', height: '2rem' }} />
        <Typography>{author?.name?.split(' ').at(0)}</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title='Upvote Comment' placement='top'>
            <IconButton
              size='small'
              onClick={() => handleVote(comment._id, 'up')}
              disabled={
                comment.upVotes.includes(user?.id) ||
                pathname.startsWith('/admin/users')
              }
              aria-label='upvote comment'
            >
              <ThumbUp sx={{ fontSize: '1rem' }} />{' '}
            </IconButton>
          </Tooltip>
          {comment.upVotes.length || 0}
        </Typography>
        <Typography sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Tooltip title='Downvote Comment' placement='top'>
            <IconButton
              size='small'
              onClick={() => handleVote(comment._id, 'down')}
              disabled={
                comment.downVotes.includes(user?.id) ||
                pathname.startsWith('/admin/users')
              }
              aria-label='downvote comment'
            >
              <ThumbDown sx={{ fontSize: '1rem' }} />{' '}
            </IconButton>
          </Tooltip>
          {comment.downVotes.length || 0}
        </Typography>
      </Box>
    </Box>
  );
}

export default CommentHeader;
