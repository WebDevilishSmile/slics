'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';
import { apiRequest } from '@/lib/apiRequest';
import { PLACE_COMMENT_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

// Text box for a new comment on a place, or a reply when `parentId` is set
// (the API files a reply-to-a-reply under the thread's top-level comment).
// A pressed-in soft well with a placeholder, not a floating label (`label`
// still names it for screen readers); the buttons show once there's a draft,
// as in the Driver tips composer (comments/CommentComposer.jsx).
function PlaceCommentComposer({
  placeId,
  parentId = null,
  label,
  placeholder,
  autoFocus = false,
  onPosted,
  onCancel,
}) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await apiRequest('/api/place-comments', {
      body: { placeId, parentId, content: draft },
    });
    setSaving(false);
    if (error) return setError(error);
    setDraft('');
    await onPosted();
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <TextField
        placeholder={label ?? placeholder}
        multiline
        minRows={draft ? 3 : 1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={saving}
        autoFocus={autoFocus}
        fullWidth
        slotProps={{
          htmlInput: {
            maxLength: PLACE_COMMENT_MAX_LENGTH,
            'aria-label': label ?? placeholder,
          },
        }}
        sx={softInputSx}
      />
      {error && <Alert severity='error'>{error}</Alert>}
      {(draft || onCancel) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={() => {
              setDraft('');
              setError('');
              onCancel?.();
            }}
            disabled={saving}
            sx={[softRaisedSmall, softPressSx, { px: 2 }]}
          >
            Cancel
          </Button>
          <Button
            type='submit'
            variant='contained'
            disabled={saving || !draft.trim()}
            sx={softContainedSx}
          >
            {saving ? 'Posting…' : parentId ? 'Reply' : 'Post'}
          </Button>
        </Box>
      )}
    </Box>
  );
}

export default PlaceCommentComposer;
