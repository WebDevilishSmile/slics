'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';

import { ThumbDown, ThumbUp } from '@mui/icons-material';
import {
  Avatar,
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';

function VoterList({ title, voters, emptyText }) {
  return (
    <>
      <Typography variant='subtitle2' sx={{ mt: 2 }}>
        {title}
      </Typography>
      {voters.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          {emptyText}
        </Typography>
      ) : (
        <List dense disablePadding>
          {voters.map((voter) => (
            <ListItem key={voter._id} disableGutters>
              <ListItemAvatar>
                <Avatar
                  src={voter.image}
                  sx={{ width: '2rem', height: '2rem' }}
                />
              </ListItemAvatar>
              <ListItemText primary={voter.name?.split(' ').at(0)} />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}

function CommentHeader({ author, comment, onVote }) {
  const user = useSession().data?.user;
  const pathname = usePathname();

  const [openVotes, setOpenVotes] = useState(false);
  const [voters, setVoters] = useState(null);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [votersError, setVotersError] = useState(null);

  // Seeing who voted is a membership perk; admins get it too. The API route
  // enforces the same rule, this only decides whether the count is tappable.
  const canViewVoters = !!user && (user.bmcMember || user.role === 'admin');

  // Fetched fresh on every open — it's one small request and it means the
  // list always matches the counts after a vote's background refetch.
  const handleOpenVotes = async () => {
    setOpenVotes(true);
    setVoters(null);
    setVotersError(null);
    setLoadingVoters(true);
    try {
      const res = await fetch(`/api/comments/${comment._id}/voters`);
      if (!res.ok) throw new Error('Failed to fetch voters');
      setVoters(await res.json());
    } catch (error) {
      console.error('Error fetching comment voters:', error);
      setVotersError('Could not load votes.');
    } finally {
      setLoadingVoters(false);
    }
  };

  const renderCount = (count, label) =>
    canViewVoters ? (
      <Tooltip title='View Vote Details' placement='top'>
        <IconButton
          size='small'
          onClick={handleOpenVotes}
          aria-label={`view who ${label} this comment`}
          // Fixed square so the 50% border-radius is a circle, not an oval.
          // 1.625rem = the thumb buttons' footprint (5px padding + 1rem icon).
          sx={{ width: '1.625rem', height: '1.625rem' }}
        >
          <Typography sx={{ lineHeight: 1 }}>{count}</Typography>
        </IconButton>
      </Tooltip>
    ) : (
      <Typography>{count}</Typography>
    );

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
        {/* Upvote Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title='Upvote Comment' placement='top'>
            <IconButton
              size='small'
              onClick={() => onVote(comment._id, 'up')}
              disabled={
                comment.upVotes.includes(user?.id) ||
                pathname.startsWith('/admin/users')
              }
              aria-label='upvote comment'
            >
              <ThumbUp sx={{ fontSize: '1rem' }} />{' '}
            </IconButton>
          </Tooltip>
          {renderCount(comment.upVotes.length || 0, 'upvoted')}
        </Box>

        {/* Downvote Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title='Downvote Comment' placement='top'>
            <IconButton
              size='small'
              onClick={() => onVote(comment._id, 'down')}
              disabled={
                comment.downVotes.includes(user?.id) ||
                pathname.startsWith('/admin/users')
              }
              aria-label='downvote comment'
            >
              <ThumbDown sx={{ fontSize: '1rem' }} />{' '}
            </IconButton>
          </Tooltip>
          {renderCount(comment.downVotes.length || 0, 'downvoted')}
        </Box>
      </Box>

      <Dialog
        open={openVotes}
        onClose={() => setOpenVotes(false)}
        disableScrollLock
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>Votes</DialogTitle>
        <DialogContent>
          <Typography>Upvotes: {comment.upVotes.length || 0}</Typography>
          <Typography>Downvotes: {comment.downVotes.length || 0}</Typography>

          <Divider sx={{ mt: 1 }} />

          {loadingVoters && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <CircularProgress size='1.5rem' />
            </Box>
          )}

          {votersError && (
            <Typography color='error' sx={{ mt: 2 }}>
              {votersError}
            </Typography>
          )}

          {voters && (
            <>
              <VoterList
                title='Upvoted by'
                voters={voters.upVoters}
                emptyText='No upvotes yet'
              />
              <VoterList
                title='Downvoted by'
                voters={voters.downVoters}
                emptyText='No downvotes yet'
              />
            </>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}

export default CommentHeader;
