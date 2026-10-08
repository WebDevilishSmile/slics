'use client';

import { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Skeleton, Typography } from '@mui/material';
import { apiRequest } from '@/utils/apiRequest';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { softRaised } from '../utility/soft';
import PlaceComment from './PlaceComment';
import PlaceCommentComposer from './PlaceCommentComposer';

// Moves the viewer's vote on one comment (top-level or reply) the way the
// server will: one vote per driver, switching sides moves it, null takes it
// back.
function applyVote(comments, commentId, voteType) {
  const update = (comment) => {
    if (comment._id !== commentId || comment.myVote === voteType) return comment;
    const next = { ...comment, myVote: voteType };
    if (comment.myVote === 'up') next.upCount -= 1;
    if (comment.myVote === 'down') next.downCount -= 1;
    if (voteType === 'up') next.upCount += 1;
    if (voteType === 'down') next.downCount += 1;
    return next;
  };
  return comments.map((comment) => ({
    ...update(comment),
    replies: comment.replies.map(update),
  }));
}

// The thread for one place, fetched when the card's comments open. Votes are
// optimistic; posts, edits and deletes reload the thread and refresh the page
// so the card's comment count follows.
function PlaceComments({ place, user }) {
  const { refresh } = useCommentRefresh();
  const [comments, setComments] = useState(null); // null while loading
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await apiRequest(
      `/api/place-comments?placeId=${place._id}`,
      { method: 'GET' },
    );
    if (error) return setError(error);
    setError('');
    setComments(data.comments);
  }, [place._id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChanged = useCallback(async () => {
    await load();
    refresh();
  }, [load, refresh]);

  const handleVote = async (commentId, voteType) => {
    setComments((current) => applyVote(current, commentId, voteType));
    const { error } = await apiRequest(
      `/api/place-comments/${commentId}/vote`,
      { body: { voteType } },
    );
    if (error) {
      setError(error);
      load(); // put the counts back to what the server has
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
      <PlaceCommentComposer
        placeId={place._id}
        placeholder='What should other drivers know? Where to park, which lanes, how clean…'
        onPosted={handleChanged}
      />

      {error && (
        <Alert severity='error' onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {comments === null ? (
        !error && (
          // A comment-shaped skeleton in the soft card shape.
          <Box
            aria-busy='true'
            aria-label='Loading comments'
            sx={[softRaised, { borderRadius: 3, p: 2 }]}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Skeleton variant='circular' width='2rem' height='2rem' />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant='text' sx={{ width: '30%' }} />
                <Skeleton variant='text' sx={{ width: '20%' }} />
              </Box>
            </Box>
            <Skeleton variant='text' sx={{ mt: 1 }} />
            <Skeleton variant='text' sx={{ width: '70%' }} />
          </Box>
        )
      ) : comments.length === 0 ? (
        <Typography color='text.secondary' sx={{ textAlign: 'center' }}>
          No comments yet. Been there? Tell other drivers how it went.
        </Typography>
      ) : (
        comments.map((comment, index) => (
          <PlaceComment
            key={comment._id}
            index={index}
            comment={comment}
            placeId={place._id}
            user={user}
            onVote={handleVote}
            onChanged={handleChanged}
          />
        ))
      )}
    </Box>
  );
}

export default PlaceComments;
