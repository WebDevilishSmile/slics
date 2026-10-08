'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Alert, Box, Button, Chip, TextField } from '@mui/material';

import { apiRequest } from '@/utils/apiRequest';
import { SLIC_COMMENT_MAX_LENGTH } from '@/utils/variables';

import { softInputSx, softPressSx, softRaisedSmall } from '../utility/soft';

// What's worth sharing, as one-tap starters. Tapping one begins the tip with
// "Parking: " (or adds a new line with it), so a driver who doesn't know what
// to write gets a nudge and readers get scannable tips.
const TOPICS = [
  'Gate / guard',
  'Parking',
  'Dock / door',
  'Hours',
  'Contact',
  'Heads-up',
  'Directions',
];

// The box for a new tip on a SLIC, or a reply when `parentId` is set (the API
// files a reply to a reply under the thread's top-level comment). `topics`
// shows the starter chips; replies leave them off. The parent can call
// `focus()` through the ref (the comment prompt's ?comment=1 path).
const CommentComposer = forwardRef(function CommentComposer(
  {
    numSlic,
    parentId = null,
    label,
    placeholder,
    topics = false,
    autoFocus = false,
    onPosted,
    onCancel,
  },
  ref,
) {
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // A topic starter alone ("Parking:") isn't a tip yet.
  const empty =
    !draft.trim() || TOPICS.some((topic) => draft.trim() === `${topic}:`);

  const startTopic = (topic) => {
    const prefix = `${topic}: `;
    setDraft((text) => (text.trim() ? `${text.trimEnd()}\n${prefix}` : prefix));
    // After React applies the new value, put the cursor at the end.
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (!input) return;
      input.focus();
      input.setSelectionRange(input.value.length, input.value.length);
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    const { error: message } = await apiRequest('/api/comment', {
      body: { numSlic, parentId, content: draft },
    });
    setSaving(false);
    if (message) return setError(message);
    setDraft('');
    await onPosted?.();
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {topics && (
        <Box
          role='group'
          aria-label='Start a tip about'
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}
        >
          {TOPICS.map((topic) => (
            <Chip
              key={topic}
              size='medium'
              label={topic}
              clickable
              onClick={() => startTopic(topic)}
              disabled={saving}
              sx={[softRaisedSmall, softPressSx]}
            />
          ))}
        </Box>
      )}

      <TextField
        inputRef={inputRef}
        // A placeholder, not a floating label: the soft well has no outline
        // for a label to sit in. The label still names the box for screen
        // readers.
        placeholder={label ?? placeholder}
        multiline
        minRows={draft ? 3 : 1}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={saving}
        autoFocus={autoFocus}
        fullWidth
        helperText={
          draft.length > SLIC_COMMENT_MAX_LENGTH - 200
            ? `${draft.length}/${SLIC_COMMENT_MAX_LENGTH}`
            : undefined
        }
        slotProps={{
          htmlInput: {
            maxLength: SLIC_COMMENT_MAX_LENGTH,
            'aria-label': label ?? placeholder,
          },
        }}
        sx={softInputSx}
      />

      {error && <Alert severity='error'>{error}</Alert>}

      {(draft || onCancel) && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          {(onCancel || draft) && (
            <Button
              onClick={() => {
                setDraft('');
                setError('');
                onCancel?.();
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          )}
          <Button type='submit' variant='contained' disabled={saving || empty}>
            {saving ? 'Posting…' : parentId ? 'Reply' : 'Post tip'}
          </Button>
        </Box>
      )}
    </Box>
  );
});

export default CommentComposer;
