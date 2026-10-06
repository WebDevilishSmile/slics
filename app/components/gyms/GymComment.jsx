'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Delete, Edit } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { GYM_COMMENT_MAX_LENGTH } from '@/utils/variables';
import { gymRequest } from './gymRequest';

function GymComment({ comment }) {
  const { isRefreshing, refresh } = useCommentRefresh();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = saving || isRefreshing;

  const startEditing = () => {
    setDraft(comment.content);
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error } = await gymRequest(`/api/gym-comments/${comment._id}`, {
      method: 'PATCH',
      body: { content: draft },
    });
    setSaving(false);
    if (error) return setError(error);
    setEditing(false);
    refresh();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    const { error } = await gymRequest(`/api/gym-comments/${comment._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    setConfirmOpen(false);
    if (error) return setError(error);
    refresh();
  };

  return (
    <Paper elevation={1} sx={{ bgcolor: 'background.comment', p: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant='body2' color='text.secondary'>
          {dayjs(comment.created_at).format('MMM D, YYYY')}
          {comment.updated_at && ' · edited'}
        </Typography>
        {!editing && (
          <Box>
            <Tooltip title='Edit comment'>
              <IconButton
                size='small'
                aria-label='Edit comment'
                onClick={startEditing}
                disabled={busy}
              >
                <Edit fontSize='small' />
              </IconButton>
            </Tooltip>
            <Tooltip title='Delete comment'>
              <IconButton
                size='small'
                aria-label='Delete comment'
                onClick={() => setConfirmOpen(true)}
                disabled={busy}
              >
                <Delete fontSize='small' color='error' />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>

      {editing ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
          <TextField
            multiline
            minRows={2}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            disabled={busy}
            autoFocus
            fullWidth
            slotProps={{ htmlInput: { maxLength: GYM_COMMENT_MAX_LENGTH } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={busy || !draft.trim()}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </Box>
        </Box>
      ) : (
        <Typography sx={{ mt: 1, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
          {comment.content}
        </Typography>
      )}

      {error && (
        <Alert severity='error' sx={{ mt: 1 }}>
          {error}
        </Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete this comment?</DialogTitle>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={saving}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}

export default GymComment;
