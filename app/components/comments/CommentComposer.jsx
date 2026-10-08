'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { AddLocationAltOutlined } from '@mui/icons-material';
import { Alert, Box, Button, Chip, TextField } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { SLIC_COMMENT_MAX_LENGTH } from '@/constants';

import PinField, { readPin } from '../form/PinField';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

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
// shows the starter chips; replies leave them off. "Add pin" attaches a spot
// (form/PinField.jsx). The parent can call `focus()` through the ref (the
// comment prompt's ?comment=1 path).
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
  const [pinOpen, setPinOpen] = useState(false);
  const [pinText, setPinText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // A topic starter alone ("Parking:") isn't a tip yet. A pin is: a tip can
  // be just a pin, or a pin with a word or two.
  const empty =
    !draft.trim() || TOPICS.some((topic) => draft.trim() === `${topic}:`);
  const hasPin = pinOpen && Boolean(readPin(pinText));
  const composing = Boolean(draft) || pinOpen || Boolean(onCancel);

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

  const closePin = () => {
    setPinOpen(false);
    setPinText('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const pin = pinOpen ? readPin(pinText) : null;
    if (pin === false) {
      setError(
        "Couldn't read the pin. Paste coordinates like 40.2732, -76.8867 or a Google Maps link, or remove the pin.",
      );
      return;
    }
    setSaving(true);
    setError('');
    const { data, error: message } = await apiRequest('/api/comment', {
      body: { numSlic, parentId, content: draft, pin },
    });
    setSaving(false);
    if (message) return setError(message);
    setDraft('');
    closePin();
    // The new id lets the list mark where it landed (Comments.jsx justPosted).
    await onPosted?.(data?.id);
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
          sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}
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

      {pinOpen && (
        <Box sx={{ mt: 1 }}>
          <PinField
            value={pinText}
            onChange={setPinText}
            onRemove={closePin}
            helperText="In Google Maps, long-press the spot, copy the coordinates and paste them here. Use my location only when you're at the spot."
            disabled={saving}
          />
        </Box>
      )}

      {error && <Alert severity='error'>{error}</Alert>}

      {/* "Add pin" is always here, so a pin can be posted with no text. */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'flex-end',
          gap: 1,
        }}
      >
        {!pinOpen && (
          <Button
            onClick={() => setPinOpen(true)}
            disabled={saving}
            startIcon={<AddLocationAltOutlined />}
            sx={[softRaisedSmall, softPressSx, { px: 1.5, mr: 'auto' }]}
          >
            Add pin
          </Button>
        )}
        {composing && (
          <Button
            onClick={() => {
              setDraft('');
              setError('');
              closePin();
              onCancel?.();
            }}
            disabled={saving}
            sx={[softRaisedSmall, softPressSx, { px: 2 }]}
          >
            Cancel
          </Button>
        )}
        {composing && (
          <Button
            type='submit'
            variant='contained'
            disabled={saving || (empty && !hasPin)}
            sx={softContainedSx}
          >
            {saving ? 'Posting…' : parentId ? 'Reply' : 'Post tip'}
          </Button>
        )}
      </Box>
    </Box>
  );
});

export default CommentComposer;
