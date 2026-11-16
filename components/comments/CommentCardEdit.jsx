'use client';

import { useState } from 'react';
import { Alert, Box, Button, TextField } from '@mui/material';

import { SLIC_COMMENT_MAX_LENGTH } from '@/constants';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { tipPhoneHelp } from '@/lib/phoneText';
import { softContainedSx, softInputSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { commentToText } from './CommentContent';

// Editing a tip's text on a CommentCard (the super admin, on
// /admin/users/[id]): the tip's words in a box, Cancel and Save. It saves
// through PATCH /api/comments/[id] like the tip's own edit on /home, which
// lets staff with the Comments area edit any tip, and leaves its pin as it
// is. A phone number that looks wrong stops the save, and numbers are saved
// (610) 555-0134 (lib/phoneText.js). Saving refreshes the server-rendered
// list (CommentRefreshContext). `onDone` closes it.
export default function CommentCardEdit({ comment, onDone }) {
  const [draft, setDraft] = useState(() => commentToText(comment));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { isRefreshing, refresh } = useCommentRefresh();
  const phoneHelp = tipPhoneHelp(draft);
  const busy = saving || isRefreshing;
  const empty = !draft.trim() && !comment.pin;

  const save = async () => {
    if (phoneHelp.error || empty) return;
    setSaving(true);
    setError('');
    const { error: message } = await apiRequest(`/api/comments/${comment._id}`, {
      method: 'PATCH',
      body: { content: draft },
    });
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    tapHaptic();
    onDone();
    refresh();
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField
        multiline
        minRows={2}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        disabled={busy}
        autoFocus
        fullWidth
        placeholder='Edit the tip'
        error={Boolean(phoneHelp.error)}
        helperText={phoneHelp.error ?? phoneHelp.hint}
        slotProps={{ htmlInput: { maxLength: SLIC_COMMENT_MAX_LENGTH, 'aria-label': 'Edit the tip' } }}
        sx={softInputSx}
      />
      {error && <Alert severity='error'>{error}</Alert>}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
        <Button onClick={onDone} disabled={busy} sx={[softRaisedSmall, softPressSx, { px: 2 }]}>
          Cancel
        </Button>
        <Button
          variant='contained'
          onClick={save}
          disabled={busy || empty || Boolean(phoneHelp.error)}
          sx={softContainedSx}
        >
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </Box>
    </Box>
  );
}
