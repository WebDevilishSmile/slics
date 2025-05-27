'use client';

import { Button, Collapse, IconButton, Paper, Typography } from '@mui/material';
import CommentEditor from './CommentEditor';
import { AddComment, HideSource } from '@mui/icons-material';
import { useState } from 'react';

function CommentsContainer({ children }) {
  const [showEditor, setShowEditor] = useState(false);

  const toggleEditor = () => {
    setShowEditor((prev) => !prev);
  };

  return (
    <Paper
      sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '40rem',
        minHeight: '36rem',
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
      >
        {showEditor ? <HideSource /> : <AddComment />}
      </IconButton>

      <Collapse in={showEditor} sx={{ width: '100%' }}>
        <CommentEditor />
      </Collapse>
      {children}
    </Paper>
  );
}

export default CommentsContainer;
