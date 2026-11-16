'use client';

import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { AddIcCallOutlined, AddLocationAltOutlined } from '@mui/icons-material';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { SLIC_COMMENT_MAX_LENGTH } from '@/constants';
import { readPhoneField, tipPhoneHelp, withPhone } from '@/lib/phoneText';

import PinField, { readPin } from '@/components/form/PinField';
import TipPhoneField from '@/components/form/TipPhoneField';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const addSx = [softRaisedSmall, softPressSx, { px: 1.5, minHeight: '2.5rem' }];

// The box for a new tip on a SLIC, or a reply when `parentId` is set (the API
// files a reply to a reply under the thread's top-level comment). `heading`
// puts a line above it asking drivers to share what they know (the SLIC's
// own box; replies leave it off). Under the box, "Add pin" attaches a spot
// (form/PinField.jsx) and "Add phone" a number (form/TipPhoneField.jsx),
// formatted (***) ***-**** as it's typed and posted on its own line at the end
// of the tip, where it shows as a button that calls it. They replaced the
// topic chips (Gate / guard, Parking…) on 2026-11-16. A tip can be just a pin
// or just a phone. The parent can call `focus()` through the ref (the comment
// prompt's ?comment=1 path).
const CommentComposer = forwardRef(function CommentComposer(
  {
    numSlic,
    parentId = null,
    label,
    placeholder,
    heading = false,
    autoFocus = false,
    onPosted,
    onCancel,
  },
  ref,
) {
  const [draft, setDraft] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [pinText, setPinText] = useState('');
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneText, setPhoneText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }));

  // A phone number in the text that looks wrong stops the post; one written
  // another way says how it will be saved (lib/phoneText.js). The phone box
  // must hold a whole number, or be empty.
  const phoneHelp = tipPhoneHelp(draft);
  const phoneField = phoneOpen ? readPhoneField(phoneText) : {};
  const blocked = Boolean(phoneHelp.error || phoneField.error);

  const hasPin = pinOpen && Boolean(readPin(pinText));
  const empty = !draft.trim() && !hasPin && !phoneField.phone;
  const composing = Boolean(draft) || pinOpen || phoneOpen || Boolean(onCancel);

  const closePin = () => {
    setPinOpen(false);
    setPinText('');
  };
  const closePhone = () => {
    setPhoneOpen(false);
    setPhoneText('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (blocked || empty) return;
    const pin = pinOpen ? readPin(pinText) : null;
    if (pin === false) {
      setError(
        "Couldn't read the pin. Paste coordinates like 40.2732, -76.8867 or a Google Maps link, or remove the pin.",
      );
      return;
    }
    setSaving(true);
    setError('');
    const { data, error: message } = await apiRequest('/api/comments', {
      body: { numSlic, parentId, content: withPhone(draft, phoneField.phone), pin },
    });
    setSaving(false);
    if (message) return setError(message);
    setDraft('');
    closePin();
    closePhone();
    // The new id lets the list mark where it landed (Comments.jsx justPosted).
    await onPosted?.(data?.id);
  };

  return (
    <Box
      component='form'
      onSubmit={handleSubmit}
      sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      {heading && (
        <Box sx={{ mb: 1 }}>
          <Typography variant='subtitle1' component='h3' sx={{ fontWeight: 700 }}>
            Share a tip with the next driver
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Where to park, which door, who to call. Add a pin for the exact spot or a phone number
            they can tap.
          </Typography>
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
        error={Boolean(phoneHelp.error)}
        helperText={
          phoneHelp.error ??
          phoneHelp.hint ??
          (draft.length > SLIC_COMMENT_MAX_LENGTH - 200
            ? `${draft.length}/${SLIC_COMMENT_MAX_LENGTH}`
            : undefined)
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

      {phoneOpen && (
        <Box sx={{ mt: 1 }}>
          <TipPhoneField value={phoneText} onChange={setPhoneText} onRemove={closePhone} disabled={saving} />
        </Box>
      )}

      {error && <Alert severity='error'>{error}</Alert>}

      {/* Add pin and Add phone are always here, so a tip can be just one of
          them. Each goes once it's open: its own field has Remove. */}
      {(!pinOpen || !phoneOpen) && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
          {!pinOpen && (
            <Button
              onClick={() => setPinOpen(true)}
              disabled={saving}
              startIcon={<AddLocationAltOutlined />}
              sx={addSx}
            >
              Add pin
            </Button>
          )}
          {!phoneOpen && (
            <Button
              onClick={() => setPhoneOpen(true)}
              disabled={saving}
              startIcon={<AddIcCallOutlined />}
              sx={addSx}
            >
              Add phone
            </Button>
          )}
        </Box>
      )}

      {composing && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1 }}>
          <Button
            onClick={() => {
              setDraft('');
              setError('');
              closePin();
              closePhone();
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
            disabled={saving || empty || blocked}
            sx={softContainedSx}
          >
            {saving ? 'Posting…' : parentId ? 'Reply' : 'Post tip'}
          </Button>
        </Box>
      )}
    </Box>
  );
});

export default CommentComposer;
