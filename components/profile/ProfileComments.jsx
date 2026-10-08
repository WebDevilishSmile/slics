'use client';

import Link from 'next/link';
import { Box, Button, Paper, Typography } from '@mui/material';

import { CommentRefreshProvider } from '@/app/context/CommentRefreshContext';
import { softContainedSx } from '@/components/utility/soft';
import CommentCard from './CommentCard';

// The driver's own tips, newest first, in a soft panel like "Driver tips" on
// /home (CLAUDE.md "Visual style"). `comments` are serialized
// (lib/serializers.js serializeComments). Deleting one refreshes this
// server-rendered list (CommentRefreshContext).
function ProfileComments({ comments }) {
  return (
    <Paper
      variant='panel'
      sx={{ minHeight: 0, px: 2, alignItems: 'stretch', gap: 3 }}
    >
      <Typography variant='h4' component='h2' sx={{ fontWeight: 700 }}>
        Your tips
        {comments.length > 0 && (
          <Typography
            component='span'
            variant='h6'
            color='text.secondary'
            sx={{ ml: 1 }}
          >
            {comments.length}
          </Typography>
        )}
      </Typography>

      {comments.length > 0 ? (
        <CommentRefreshProvider>
          {comments.map((comment, index) => (
            <CommentCard key={comment._id} comment={comment} index={index} />
          ))}
        </CommentRefreshProvider>
      ) : (
        <Box sx={{ textAlign: 'center', pb: 2 }}>
          <Typography color='text.secondary' sx={{ mb: 2 }}>
            No tips yet. Gate codes, where to park, which door: share what
            helps the next driver from any SLIC you look up.
          </Typography>
          <Button
            variant='contained'
            component={Link}
            href='/home'
            sx={softContainedSx}
          >
            Look up a SLIC
          </Button>
        </Box>
      )}
    </Paper>
  );
}

export default ProfileComments;
