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
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import { GYM_COMMENT_MAX_LENGTH } from '@/constants';
import { apiRequest } from '@/utils/apiRequest';

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
    const { error } = await apiRequest(`/api/gym-comments/${comment._id}`, {
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
    const { error } = await apiRequest(`/api/gym-comments/${comment._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    setConfirmOpen(false);
    if (error) return setError(error);
    refresh();
  };

  return (
    <Box sx={[softInset, { p: 2 }]}>
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
                sx={softPressSx}
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
                sx={softPressSx}
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
            sx={softInputSx}
            slotProps={{ htmlInput: { maxLength: GYM_COMMENT_MAX_LENGTH } }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={() => setEditing(false)}
              disabled={busy}
              sx={[softRaisedSmall, softPressSx, { px: 2 }]}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={busy || !draft.trim()}
              sx={softContainedSx}
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

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>Delete this comment?</DialogTitle>
        <DialogContent>
          <DialogContentText>This can&apos;t be undone.</DialogContentText>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirmOpen(false)}
            disabled={saving}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            color='error'
            onClick={handleDelete}
            disabled={saving}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default GymComment;
