'use client';

import { Button, Collapse, IconButton, Paper, Typography } from '@mui/material';
import CommentEditor from './CommentEditor';
import { AddComment, HideSource } from '@mui/icons-material';
import { useState } from 'react';
import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';

function CommentsContainer({ children, user, numSlic, refetchComments }) {
  const [showEditor, setShowEditor] = useState(false);

  const toggleEditor = () => {
    setShowEditor((prev) => !prev);
  };

  return (
    <Paper
      elevation={ELEVATION}
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: MAX_WIDTH,
        minHeight: MIN_HEIGHT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        mt: '2rem',
        py: '2rem',
        px: '1rem',
      }}
    >
      <Typography variant='h4' sx={{ textAlign: 'center', mb: '1rem' }}>
        Comments
      </Typography>

      <IconButton
        sx={{ position: 'absolute', top: '2rem', right: '2rem' }}
        onClick={toggleEditor}
        disabled={!numSlic}
      >
        {showEditor ? <HideSource /> : <AddComment />}
      </IconButton>

      <Collapse in={showEditor} sx={{ width: '100%' }}>
        <CommentEditor
          user={user}
          numSlic={numSlic}
          refetchComments={refetchComments}
          setShowEditor={setShowEditor}
        />
      </Collapse>
      {children}
    </Paper>
  );
}

export default CommentsContainer;
