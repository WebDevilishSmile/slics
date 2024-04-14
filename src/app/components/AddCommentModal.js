import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import {
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextareaAutosize,
  Typography,
} from '@mui/material';

export default function AddCommentModal({
  user,
  customer,
  handleCloseCommModal,
}) {
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const router = useRouter();
  const supabase = createClientComponentClient();
  const userName = user.user_metadata.name.split(' ')[0];
  const userId = user.id;
  const userAvatar = user.user_metadata.picture;

  const customerSlic = customer.numSlic;

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const handleComment = (e) => {
    setComment(e.target.value);
  };

  const insertComment = async () => {
    const { data, error } = await supabase
      .from('comments')
      .insert([
        {
          numSlic: customerSlic,
          user: userName,
          title: title,
          comment: comment,
          user_id: userId,
          user_avatar: userAvatar,
        },
      ])
      .select();

    handleCloseCommModal();
    router.refresh();
  };

  return (
    <Paper
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        p: '1.5rem',
        bgcolor: '#fff8e6',
      }}
    >
      <Typography variant='h6' sx={{ mb: '1rem' }}>
        ADD COMMENT
      </Typography>
      <FormControl fullWidth>
        <InputLabel id='comment-title-label'>Title</InputLabel>
        <Select
          labelId='comment-title-label'
          fullWidth
          label='Title'
          value={title}
          onChange={handleTitleChange}
          sx={{ color: '#333' }}
        >
          <MenuItem value='Directions'>Directions</MenuItem>
          <MenuItem value='Instructions'>Instructions</MenuItem>
          <MenuItem value='Correction'>Correction</MenuItem>
        </Select>
      </FormControl>
      <TextareaAutosize
        aria-label='Comment'
        placeholder='Comment'
        minRows={2}
        maxRows={4}
        value={comment}
        onChange={handleComment}
        style={{
          width: '20rem',
          fontSize: '1rem',
          fontFamily: 'Montserrat',
          padding: '.5rem',
          lineHeight: '1.5',
          margin: '1rem 0',
          border: '1px solid #999',
          borderRadius: '4px',
        }}
      />

      <Button variant='contained' onClick={insertComment}>
        Save Comment
      </Button>
    </Paper>
  );
}
