'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Delete, Edit, Reply, ThumbDown, ThumbUp } from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@mui/material';
import { apiRequest } from '@/utils/apiRequest';
import { PLACE_COMMENT_MAX_LENGTH } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import PlaceCommentComposer from './PlaceCommentComposer';

// One comment on a place and, for a top-level comment, its replies indented
// underneath. Threads are one level deep: "Reply" on a reply posts into the
// same thread. A soft-deleted comment renders as a "Comment deleted" note so
// its replies keep their context.
function PlaceComment({ comment, placeId, user, onVote, onChanged, isReply = false }) {
  const { isRefreshing } = useCommentRefresh();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = saving || isRefreshing;
  const canManage = comment.isMine || user?.role === 'admin';
  const authorName = comment.author?.firstName ?? 'Former driver';
  const hasReplies = !isReply && comment.replies.length > 0;

  const startEditing = () => {
    setDraft(comment.content);
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error } = await apiRequest(`/api/place-comments/${comment._id}`, {
      method: 'PATCH',
      body: { content: draft },
    });
    setSaving(false);
    if (error) return setError(error);
    setEditing(false);
    await onChanged();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    const { error } = await apiRequest(`/api/place-comments/${comment._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    setConfirmOpen(false);
    if (error) return setError(error);
    await onChanged();
  };

  const vote = (voteType) => {
    if (comment.myVote !== voteType) onVote(comment._id, voteType);
  };

  const replies = hasReplies && (
    <Box
      sx={{
        ml: 2,
        pl: 1.5,
        borderLeft: 2,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      {comment.replies.map((reply) => (
        <PlaceComment
          key={reply._id}
          comment={reply}
          placeId={placeId}
          user={user}
          onVote={onVote}
          onChanged={onChanged}
          isReply
        />
      ))}
    </Box>
  );

  if (comment.deleted) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Paper variant='outlined' sx={{ p: 2 }}>
          <Typography color='text.secondary' sx={{ fontStyle: 'italic' }}>
            Comment deleted
          </Typography>
        </Paper>
        {replies}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Paper elevation={1} sx={{ bgcolor: 'background.comment', p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={comment.author?.image ?? undefined}
            alt=''
            sx={{ width: '2rem', height: '2rem' }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant='subtitle2'>{authorName}</Typography>
            <Typography variant='caption' color='text.secondary'>
              {dayjs(comment.created_at).format('MMM D, YYYY')}
              {comment.updated_at && ' · edited'}
            </Typography>
          </Box>
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
              slotProps={{ htmlInput: { maxLength: PLACE_COMMENT_MAX_LENGTH } }}
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

        {!editing && (
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 0.5,
              mt: 1,
            }}
          >
            <IconButton
              size='small'
              aria-label='Upvote comment'
              aria-pressed={comment.myVote === 'up'}
              color={comment.myVote === 'up' ? 'primary' : 'default'}
              onClick={() => vote('up')}
              disabled={busy}
            >
              <ThumbUp sx={{ fontSize: '1rem' }} />
            </IconButton>
            <Typography variant='body2'>{comment.upCount}</Typography>
            <IconButton
              size='small'
              aria-label='Downvote comment'
              aria-pressed={comment.myVote === 'down'}
              color={comment.myVote === 'down' ? 'primary' : 'default'}
              onClick={() => vote('down')}
              disabled={busy}
              sx={{ ml: 1 }}
            >
              <ThumbDown sx={{ fontSize: '1rem' }} />
            </IconButton>
            <Typography variant='body2'>{comment.downCount}</Typography>

            <Button
              size='small'
              startIcon={<Reply />}
              onClick={() => setReplying((open) => !open)}
              disabled={busy}
              sx={{ ml: 1 }}
            >
              Reply
            </Button>

            {canManage && (
              <Box sx={{ ml: 'auto' }}>
                <IconButton
                  size='small'
                  aria-label='Edit comment'
                  onClick={startEditing}
                  disabled={busy}
                >
                  <Edit fontSize='small' />
                </IconButton>
                <IconButton
                  size='small'
                  aria-label='Delete comment'
                  onClick={() => setConfirmOpen(true)}
                  disabled={busy}
                >
                  <Delete fontSize='small' color='error' />
                </IconButton>
              </Box>
            )}
          </Box>
        )}

        {error && (
          <Alert severity='error' sx={{ mt: 1 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {replying && (
        <Box sx={{ ml: isReply ? 0 : 2 }}>
          <PlaceCommentComposer
            placeId={placeId}
            parentId={comment._id}
            label={`Reply to ${authorName}`}
            autoFocus
            onCancel={() => setReplying(false)}
            onPosted={async () => {
              setReplying(false);
              await onChanged();
            }}
          />
        </Box>
      )}

      {replies}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete this comment?</DialogTitle>
        {hasReplies && (
          <DialogContent>
            <DialogContentText>
              The replies stay, under a &quot;Comment deleted&quot; note.
            </DialogContentText>
          </DialogContent>
        )}
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
    </Box>
  );
}

export default PlaceComment;
