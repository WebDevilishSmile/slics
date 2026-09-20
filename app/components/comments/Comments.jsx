'use client';

import { Alert, Snackbar, Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Comment from './Comment';
import CommentsContainer from './CommentsContainer';
import NoSlicComments from './NoSlicComments';

function Comments({ user }) {
  const [comments, setComments] = useState([]);
  const [slicName, setSlicName] = useState(null);
  const [authorsMap, setAuthorsMap] = useState({});
  const [voteError, setVoteError] = useState(false);
  const searchParams = useSearchParams();
  const numSlic = searchParams.get('slic');

  const fetchComments = useCallback(async () => {
    // No ?slic= in the URL (plain /home) — nothing to fetch. Without this the
    // null is stringified into /api/comments?slic=null and the server logs a
    // not-found error for a SLIC named "null" on every home-page visit.
    if (!numSlic) {
      setComments([]);
      setSlicName(null);
      setAuthorsMap({});
      return;
    }
    try {
      const response = await fetch(`/api/comments?slic=${numSlic}`);
      if (!response.ok) throw new Error('Failed to fetch comments');
      const data = await response.json();
      setComments(data.comments);
      setSlicName(data.slicName);

      const uniqueUserIds = [
        ...new Set(data.comments.map((c) => c.userId).filter(Boolean)),
      ];
      const results = await Promise.all(
        uniqueUserIds.map((id) =>
          fetch(`/api/users/${id}`)
            .then((r) => (r.ok ? r.json() : null))
            .catch(() => null)
        )
      );
      const map = {};
      results.forEach((author) => {
        if (author?._id) map[author._id.toString()] = author;
      });
      setAuthorsMap(map);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  }, [numSlic]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments, searchParams]);

  // Optimistic vote: mirror what the API does (`$addToSet` on one side,
  // `$pull` from the other) so the count and the button's disabled state
  // update on tap. The background refetch then re-sorts the list by votes;
  // on failure only this comment's arrays are put back.
  const handleVote = useCallback(
    async (commentId, voteType) => {
      const userId = user?.id;
      if (!userId) return;

      const add = voteType === 'up' ? 'upVotes' : 'downVotes';
      const remove = voteType === 'up' ? 'downVotes' : 'upVotes';

      const before = comments.find((c) => c._id === commentId);
      if (!before) return;
      const snapshot = { upVotes: before.upVotes, downVotes: before.downVotes };

      setComments((prev) =>
        prev.map((c) =>
          c._id === commentId
            ? {
                ...c,
                [add]: (c[add] ?? []).includes(userId)
                  ? c[add]
                  : [...(c[add] ?? []), userId],
                [remove]: (c[remove] ?? []).filter((id) => id !== userId),
              }
            : c
        )
      );

      try {
        const res = await fetch(`/api/comments/${commentId}/vote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType }),
        });
        if (!res.ok) throw new Error(`Vote failed with status ${res.status}`);
        fetchComments();
      } catch (error) {
        console.error('Error saving vote:', error);
        setComments((prev) =>
          prev.map((c) => (c._id === commentId ? { ...c, ...snapshot } : c))
        );
        setVoteError(true);
      }
    },
    [comments, user?.id, fetchComments]
  );

  if (!numSlic) {
    return <NoSlicComments />;
  }

  return (
    <CommentsContainer
      user={user}
      numSlic={numSlic}
      refetchComments={fetchComments}
    >
      {comments.length > 0 ? (
        comments.map((comment) => (
          <Comment
            key={comment._id}
            comment={comment}
            author={authorsMap[comment.userId?.toString()]}
            slicName={slicName}
            refetchComments={fetchComments}
            onVote={handleVote}
          />
        ))
      ) : (
        <>
          <Typography sx={{ mt: 2 }}>
            Be the first to post a comment!
          </Typography>
          <Typography sx={{ mt: 1 }}>
            Click the plus icon to add a comment.
          </Typography>
        </>
      )}

      <Snackbar
        open={voteError}
        autoHideDuration={4000}
        onClose={() => setVoteError(false)}
      >
        <Alert severity='error' onClose={() => setVoteError(false)}>
          Couldn&apos;t save your vote. Please try again.
        </Alert>
      </Snackbar>
    </CommentsContainer>
  );
}

export default Comments;
