'use client';

import { Typography } from '@mui/material';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import Comment from './Comment';
import CommentsContainer from './CommentsContainer';
import NoSlicComments from './NoSlicComments';

function Comments({ user }) {
  const [comments, setComments] = useState([]);
  const searchParams = useSearchParams();
  const numSlic = searchParams.get('slic');

  const fetchComments = useCallback(async () => {
    try {
      const response = await fetch(`/api/comments?slic=${numSlic}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(data);
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
