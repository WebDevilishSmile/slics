'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { GYM_COMMENT_MAX_LENGTH } from '@/utils/variables';
import { apiRequest } from '@/utils/apiRequest';
import GymComment from './GymComment';

// Plain-text comments on one gym — how to get in, where to park. The list
// arrives server-rendered with the gym (newest first); posting refreshes it.
function GymComments({ gym }) {
  const { isRefreshing, refresh } = useCommentRefresh();
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await apiRequest('/api/gym-comments', {
      body: { gymId: gym._id, content: draft },
    });
    setSaving(false);
    if (error) return setError(error);
    setDraft('');
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
      <Box
        component='form'
        onSubmit={handleSubmit}
        sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
      >
        <TextField
          label='Add a comment'
          placeholder='How to get in, where to park…'
          multiline
          minRows={2}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          disabled={saving}
          fullWidth
          slotProps={{ htmlInput: { maxLength: GYM_COMMENT_MAX_LENGTH } }}
        />
        {error && <Alert severity='error'>{error}</Alert>}
        <Button
          type='submit'
          variant='contained'
          disabled={saving || isRefreshing || !draft.trim()}
          sx={{ alignSelf: 'flex-end' }}
        >
          {saving ? 'Posting…' : 'Post'}
        </Button>
      </Box>

      {gym.comments.length === 0 ? (
        <Typography color='text.secondary'>No comments yet.</Typography>
      ) : (
        gym.comments.map((comment) => (
          <GymComment key={comment._id} comment={comment} />
        ))
      )}
    </Box>
  );
}

export default GymComments;
