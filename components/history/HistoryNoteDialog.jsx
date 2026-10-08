'use client';

import { useEffect, useId, useState } from 'react';
import {
  Alert,
  Button,
  CircularProgress,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';
import BottomSheetDialog, {
  BottomSheetActions,
} from '@/components/utility/BottomSheetDialog';

export const NOTE_MAX = 280; // matches HISTORY_NOTE_MAX in lib/db/slicViews.js

// A private note on one lookup ("load was late"). Saving an empty note, or
// "Delete note", clears it. `view` is the row being edited, or null when closed.
export default function HistoryNoteDialog({ view, onClose, onSaved }) {
  const titleId = useId();
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (view) {
      setText(view.note || '');
      setError('');
    }
  }, [view]);

  const save = async (note) => {
    setSaving(true);
    setError('');
    const { data, error: message } = await apiRequest(
      `/api/users/me/history/${view.id}`,
      { method: 'PATCH', body: { note } },
    );
    setSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onSaved(view.id, data.note);
  };

  const label = view?.slic?.alphaSlic || view?.numSlic;

  return (
    <BottomSheetDialog
      open={Boolean(view)}
      onClose={saving ? undefined : onClose}
      aria-labelledby={titleId}
    >
      <DialogTitle id={titleId}>
        {view?.note ? 'Edit note' : 'Add a note'}
        {label ? ` · ${label}` : ''}
      </DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          multiline
          minRows={3}
          label='Note'
          placeholder='Only you can see this.'
          value={text}
          onChange={(event) => setText(event.target.value.slice(0, NOTE_MAX))}
          helperText={`${text.length}/${NOTE_MAX}`}
          disabled={saving}
          sx={[softInputSx, { mt: 1 }]}
        />
        {error && (
          <Alert severity='error' sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <BottomSheetActions>
        <Button
          variant='contained'
          onClick={() => save(text)}
          disabled={saving || text.trim() === (view?.note || '')}
          sx={softContainedSx}
          startIcon={saving ? <CircularProgress size={16} color='inherit' /> : null}
        >
          Save note
        </Button>
        {view?.note && (
          <Button
            color='error'
            onClick={() => save('')}
            disabled={saving}
            sx={[softRaisedSmall, softPressSx]}
          >
            Delete note
          </Button>
        )}
        <Button
          onClick={onClose}
          disabled={saving}
          sx={[softRaisedSmall, softPressSx]}
        >
          Cancel
        </Button>
      </BottomSheetActions>
    </BottomSheetDialog>
  );
}
