'use client';

import { ELEVATION, MAX_WIDTH, MIN_HEIGHT } from '@/utils/variables';
import { AddComment, HideSource, ImageOutlined } from '@mui/icons-material';
import {
  Box,
  Button,
  Collapse,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import Image from 'next/image';
import { useRef, useState } from 'react';
import CommentEditor from './CommentEditor';

function CommentsContainer({ children, user, numSlic, refetchComments }) {
  const [showEditor, setShowEditor] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const fileInputRef = useRef(null);

  const toggleEditor = () => {
    setShowEditor((prev) => !prev);
  };

  const toggleImage = () => {
    setShowImage((prev) => !prev);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(URL.createObjectURL(file));
    }
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
      <IconButton
        sx={{ position: 'absolute', top: '2rem', left: '2rem' }}
        onClick={toggleImage}
        disabled={!numSlic}
      >
        <ImageOutlined />
      </IconButton>

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

      <Collapse in={showImage} sx={{ width: '100%' }}>
        <TextField
          sx={{ my: '1rem' }}
          type='file'
          accept='image/*'
          onChange={handleImageChange}
        />

        {selectedImage && (
          <Box
            sx={{
              mb: '1rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Box sx={{ position: 'relative', width: '100%', height: '18rem' }}>
              <Image
                src={selectedImage}
                alt='Selected'
                fill
                style={{ maxWidth: '100%', objectFit: 'contain' }}
              />
            </Box>

            <Button variant='contained' color='primary' sx={{ mt: '1rem' }}>
              Upload
            </Button>
          </Box>
        )}
      </Collapse>

      {children}
    </Paper>
  );
}

export default CommentsContainer;
