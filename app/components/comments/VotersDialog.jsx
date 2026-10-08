'use client';

import { useEffect, useState } from 'react';
import {
  Avatar,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';

import { softInset } from '../utility/soft';

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
                <Avatar src={voter.image} alt='' sx={{ width: '2rem', height: '2rem' }} />
              </ListItemAvatar>
              <ListItemText primary={voter.name?.split(' ').at(0)} />
            </ListItem>
          ))}
        </List>
      )}
    </>
  );
}

// Who voted on a comment: a membership perk (admins too). The API enforces
// the same rule. Fetched fresh on every open so it matches the counts.
export default function VotersDialog({ comment, open, onClose }) {
  const [voters, setVoters] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setVoters(null);
    setError('');
    fetch(`/api/comments/${comment._id}/voters`)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.status))))
      .then((data) => !cancelled && setVoters(data))
      .catch(() => !cancelled && setError('Could not load votes.'));
    return () => {
      cancelled = true;
    };
  }, [open, comment._id]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs' disableScrollLock>
      <DialogTitle>Votes</DialogTitle>
      <DialogContent>
        <Box sx={[softInset, { borderRadius: 3, px: 2, py: 1.5 }]}>
          <Typography>Helpful: {comment.upCount}</Typography>
          <Typography>Not helpful: {comment.downCount}</Typography>
        </Box>
        {/* Loading: rows shaped like the voter list. */}
        {!voters && !error && (
          <Box sx={{ mt: 2 }} aria-busy='true'>
            {[0, 1, 2].map((row) => (
              <Box
                key={row}
                sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.75 }}
              >
                <Skeleton variant='circular' width='2rem' height='2rem' />
                <Skeleton variant='text' width='40%' />
              </Box>
            ))}
          </Box>
        )}
        {error && (
          <Typography color='error' sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        {voters && (
          <>
            <VoterList title='Helpful to' voters={voters.upVoters} emptyText='Nobody yet' />
            <VoterList
              title='Not helpful to'
              voters={voters.downVoters}
              emptyText='Nobody yet'
            />
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
