import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import {
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextareaAutosize,
  Typography,
  Button,
} from '@mui/material';

export default function EditCommentModal({
  user,
  customer,
  handleCloseEditModal,
  com,
  title,
  comment,
}) {
  const [newTitle, setNewTitle] = useState(title);
  const [newComment, setNewComment] = useState(comment);

  const router = useRouter();
  const supabase = createClientComponentClient();
  const userName = user.user_metadata.name.split(' ')[0];
  const userId = user.id;
  const userAvatar = user.user_metadata.picture;

  const customerSlic = customer.numSlic;

  const handleTitleChange = (e) => {
    setNewTitle(e.target.value);
  };

  const handleComment = (e) => {
    setNewComment(e.target.value);
  };

  const editComment = async () => {
    const { data, error } = await supabase
      .from('comments')
      .update({ comment: newComment })
      .eq('id', com.id)
      .select();

    handleCloseEditModal();
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
      <Typography variant="h6" sx={{ mb: '1rem' }}>
        ADD COMMENT
      </Typography>
      <FormControl fullWidth>
        <InputLabel id="comment-title-label">Title</InputLabel>
        <Select
          labelId="comment-title-label"
          fullWidth
          label="Title"
          value={newTitle}
          onChange={handleTitleChange}
          sx={{ color: '#333' }}
        >
          <MenuItem value="Directions">Directions</MenuItem>
          <MenuItem value="Instructions">Instructions</MenuItem>
          <MenuItem value="Correction">Correction</MenuItem>
        </Select>
      </FormControl>
      <TextareaAutosize
        aria-label="Comment"
        placeholder="Comment"
        minRows={2}
        maxRows={4}
        value={newComment}
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

      <Button variant="contained" onClick={editComment}>
        Save Comment
      </Button>
    </Paper>
  );
}
