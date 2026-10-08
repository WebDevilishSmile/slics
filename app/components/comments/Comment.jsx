'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  DeleteOutline,
  EditOutlined,
  Reply,
  ThumbDown,
  ThumbDownOutlined,
  ThumbUp,
  ThumbUpOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
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
import { SLIC_COMMENT_MAX_LENGTH } from '@/utils/variables';

import CommentComposer from './CommentComposer';
import CommentContent, { commentToText } from './CommentContent';
import VotersDialog from './VotersDialog';

dayjs.extend(relativeTime);

// 40px vote targets (UI-SUGGESTIONS.md #45): padding, not bigger icons.
const voteSx = { width: '2.5rem', height: '2.5rem' };

// One tip and, for a top-level tip, its replies indented underneath. Threads
// are one level deep: "Reply" on a reply posts into the same thread. A
// top-level tip deleted while it had replies renders as "Comment deleted" so
// the replies keep their context.
function Comment({ comment, numSlic, user, isNew, onVote, onChanged, isReply = false }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [replying, setReplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [votersOpen, setVotersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canManage = comment.isMine || user?.role === 'admin';
  const canViewVoters = Boolean(user?.bmcMember || user?.role === 'admin');
  const authorName = comment.author?.firstName ?? 'Former driver';
  const hasReplies = !isReply && comment.replies?.length > 0;
  const posted = dayjs(comment.created_at);

  const startEditing = () => {
    setDraft(commentToText(comment));
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const { error: message } = await apiRequest(`/api/comments/${comment._id}`, {
      method: 'PATCH',
      body: { content: draft },
    });
    setSaving(false);
    if (message) return setError(message);
    setEditing(false);
    await onChanged();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    const { error: message } = await apiRequest(`/api/comments/${comment._id}`, {
      method: 'DELETE',
    });
    setSaving(false);
    setConfirmOpen(false);
    if (message) return setError(message);
    await onChanged();
  };

  // Tapping your own vote again takes it back.
  const vote = (voteType) =>
    onVote(comment, comment.myVote === voteType ? null : voteType);

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
        <Comment
          key={reply._id}
          comment={reply}
          numSlic={numSlic}
          user={user}
          isNew={isNew}
          onVote={onVote}
          onChanged={onChanged}
          isReply
        />
      ))}
    </Box>
  );

  const replyBox = replying && (
    <Box sx={{ ml: isReply ? 0 : 2 }}>
      <CommentComposer
        numSlic={numSlic}
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
  );

  if (comment.deleted) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Paper variant='outlined' sx={{ p: 2, bgcolor: 'transparent' }}>
          <Typography color='text.secondary' sx={{ fontStyle: 'italic' }}>
            Comment deleted
          </Typography>
        </Paper>
        {replies}
      </Box>
    );
  }

  const count = (n, label) =>
    canViewVoters ? (
      <Button
        size='small'
        color='inherit'
        onClick={() => setVotersOpen(true)}
        aria-label={`${n} ${label}. See who voted`}
        sx={{ minWidth: '2rem', px: 0.5 }}
      >
        {n}
      </Button>
    ) : (
      <Typography variant='body2' sx={{ minWidth: '1rem' }}>
        {n}
      </Typography>
    );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <Paper
        elevation={isReply ? 0 : 1}
        sx={{
          bgcolor: 'background.comment',
          p: 2,
          pb: 1,
          // A new tip gets a brand-colored edge as well as the "New" chip.
          borderLeft: isNew(comment) ? 4 : 0,
          borderColor: 'primary.main',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Avatar
            src={comment.author?.image ?? undefined}
            alt=''
            sx={{ width: '2rem', height: '2rem' }}
          />
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant='subtitle2'>{authorName}</Typography>
            {/* Relative time says whether a gate code is still fresh; the
                exact date is a hover/long-press away. */}
            <Typography
              variant='caption'
              color='text.secondary'
              component='time'
              dateTime={posted.toISOString()}
              title={posted.format('MMM D, YYYY h:mm A')}
            >
              {posted.fromNow()}
              {comment.updated_at && ' · edited'}
            </Typography>
          </Box>
          {isNew(comment) && <Chip label='New' color='primary' size='small' />}
          {/* Edit/delete sit up here, not in the vote row, so that row fits a
              phone without wrapping. */}
          {canManage && !editing && (
            <Box sx={{ display: 'flex', mr: -1 }}>
              <IconButton aria-label='Edit tip' onClick={startEditing} sx={voteSx}>
                <EditOutlined fontSize='small' />
              </IconButton>
              <IconButton
                aria-label='Delete tip'
                onClick={() => setConfirmOpen(true)}
                sx={voteSx}
              >
                <DeleteOutline fontSize='small' color='error' />
              </IconButton>
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
              disabled={saving}
              autoFocus
              fullWidth
              label='Edit your tip'
              slotProps={{ htmlInput: { maxLength: SLIC_COMMENT_MAX_LENGTH } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Button onClick={() => setEditing(false)} disabled={saving}>
                Cancel
              </Button>
              <Button
                variant='contained'
                onClick={handleSave}
                disabled={saving || !draft.trim()}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ mt: 1 }}>
            <CommentContent comment={comment} />
          </Box>
        )}

        {!editing && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', mt: 0.5, ml: -1 }}>
            <IconButton
              aria-label='Helpful'
              aria-pressed={comment.myVote === 'up'}
              color={comment.myVote === 'up' ? 'primary' : 'default'}
              onClick={() => vote('up')}
              sx={voteSx}
            >
              {comment.myVote === 'up' ? (
                <ThumbUp sx={{ fontSize: '1.1rem' }} />
              ) : (
                <ThumbUpOutlined sx={{ fontSize: '1.1rem' }} />
              )}
            </IconButton>
            {count(comment.upCount, 'found this helpful')}
            <IconButton
              aria-label='Not helpful'
              aria-pressed={comment.myVote === 'down'}
              color={comment.myVote === 'down' ? 'primary' : 'default'}
              onClick={() => vote('down')}
              sx={{ ...voteSx, ml: 0.5 }}
            >
              {comment.myVote === 'down' ? (
                <ThumbDown sx={{ fontSize: '1.1rem' }} />
              ) : (
                <ThumbDownOutlined sx={{ fontSize: '1.1rem' }} />
              )}
            </IconButton>
            {count(comment.downCount, 'found this not helpful')}

            <Button
              size='small'
              startIcon={<Reply />}
              onClick={() => setReplying((open) => !open)}
              sx={{ ml: 1, minHeight: '2.5rem' }}
            >
              Reply
            </Button>
          </Box>
        )}

        {error && (
          <Alert severity='error' sx={{ my: 1 }}>
            {error}
          </Alert>
        )}
      </Paper>

      {replyBox}
      {replies}

      {canViewVoters && (
        <VotersDialog
          comment={comment}
          open={votersOpen}
          onClose={() => setVotersOpen(false)}
        />
      )}

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        aria-labelledby={`delete-${comment._id}`}
        disableScrollLock
      >
        <DialogTitle id={`delete-${comment._id}`}>Delete this tip?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {hasReplies
              ? 'The replies stay, under a "Comment deleted" note.'
              : "This can't be undone."}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button variant='contained' color='error' onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Comment;
