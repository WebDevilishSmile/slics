'use client';

import { KeyboardArrowDown, KeyboardArrowUp, Sort } from '@mui/icons-material';
import { Box, Button, Typography, Divider } from '@mui/material';
import { useState, useMemo } from 'react';
import Comment from './Comment';
import CommentsSearch from './CommentsSearch';

function CommentsDisplay({ comments = [], slics = [], users = [] }) {
  const [search, setSearch] = useState('');
  // Simplified to just track date order
  const [isDesc, setIsDesc] = useState(true);

  // Memoize lookups for performance
  const slicMap = useMemo(
    () => Object.fromEntries(slics.map((s) => [s.numSlic, s])),
    [slics]
  );
  const userMap = useMemo(
    () => Object.fromEntries(users.map((u) => [u._id, u])),
    [users]
  );

  const processedComments = useMemo(() => {
    const searchTerm = search.toLowerCase();

    // 1. Robust Filter: Content, Slic Number, Slic Name, and Author Name
    let result = [...comments].filter((comment) => {
      const associatedSlic = slicMap[comment.numSlic];
      const associatedAuthor = userMap[comment.userId];

      const contentMatch = comment.content?.toLowerCase().includes(searchTerm);
      const numSlicMatch = String(comment.numSlic || '')
        .toLowerCase()
        .includes(searchTerm);
      const slicNameMatch = associatedSlic?.name
        ?.toLowerCase()
        .includes(searchTerm);
      const authorMatch = associatedAuthor?.name
        ?.toLowerCase()
        .includes(searchTerm);

      return contentMatch || numSlicMatch || slicNameMatch || authorMatch;
    });

    // 2. Simple Date Sort
    result.sort((a, b) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return isDesc ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [comments, search, isDesc, slicMap, userMap]);

  return (
    <Box
      sx={{ mt: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      <CommentsSearch
        comments={processedComments}
        search={search}
        setSearch={setSearch}
      />

      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Button
            size='small'
            variant='outlined'
            onClick={() => setIsDesc(!isDesc)}
            startIcon={isDesc ? <KeyboardArrowDown /> : <KeyboardArrowUp />}
          >
            {isDesc ? 'Newest First' : 'Oldest First'}
          </Button>
        </Box>

        <Typography variant='caption' color='text.secondary'>
          {processedComments.length} results
        </Typography>
      </Box>

      <Divider />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {processedComments.length > 0 ? (
          processedComments.map((comment) => (
            <Comment
              key={comment._id}
              comment={comment}
              slic={slicMap[comment.numSlic]}
              author={userMap[comment.userId]}
            />
          ))
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Typography color='textSecondary'>
              No comments match your search.
            </Typography>
            <Button size='small' onClick={() => setSearch('')} sx={{ mt: 1 }}>
              Clear Search
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default CommentsDisplay;
