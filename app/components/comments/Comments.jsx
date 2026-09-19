'use client';

import { Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Comment from './Comment';
import CommentsContainer from './CommentsContainer';
import NoSlicComments from './NoSlicComments';

function Comments({ user }) {
  const [comments, setComments] = useState([]);
  const [slicName, setSlicName] = useState(null);
  const [authorsMap, setAuthorsMap] = useState({});
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
        comments.map((comment, index) => (
          <Comment
            key={index}
            comment={comment}
            author={authorsMap[comment.userId?.toString()]}
            slicName={slicName}
            refetchComments={fetchComments}
          />
        ))
      ) : (
        <>
          <Typography sx={{ mt: '1rem' }}>
            Be the first to post a comment!
          </Typography>
          <Typography sx={{ mt: '0.5rem' }}>
            Click the plus icon to add a comment.
          </Typography>
        </>
      )}
    </CommentsContainer>
  );
}

export default Comments;
