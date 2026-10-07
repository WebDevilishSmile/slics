'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';
import { apiRequest } from '@/utils/apiRequest';
import { PLACE_COMMENT_MAX_LENGTH } from '@/utils/variables';

// Text box for a new comment on a place, or a reply when `parentId` is set
// (the API files a reply-to-a-reply under the thread's top-level comment).
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
        label={label}
        placeholder={placeholder}
        multiline
        minRows={2}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={saving}
        autoFocus={autoFocus}
        fullWidth
        slotProps={{ htmlInput: { maxLength: PLACE_COMMENT_MAX_LENGTH } }}
      />
      {error && <Alert severity='error'>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        {onCancel && (
          <Button onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          type='submit'
          variant='contained'
          disabled={saving || !draft.trim()}
        >
          {saving ? 'Posting…' : parentId ? 'Reply' : 'Post'}
        </Button>
      </Box>
    </Box>
  );
}

export default PlaceCommentComposer;
