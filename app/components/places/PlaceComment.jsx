'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import { apiRequest } from '@/utils/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { PLACE_COMMENT_MAX_LENGTH } from '@/utils/variables';
import { useCommentRefresh } from '@/app/context/CommentRefreshContext';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '../utility/soft';
import PlaceCommentComposer from './PlaceCommentComposer';

// 40px vote and action targets: padding, not bigger icons.
const actionSx = { width: '2.5rem', height: '2.5rem' };

// One comment on a place, in the same soft style as the Driver tips on /home
// (comments/Comment.jsx): a raised card holding its replies in a pressed-in
// well, or, for a reply, a flat row inside that well. Threads are one level
// deep: "Reply" on a reply posts into the same thread. A soft-deleted comment
// renders as a "Comment deleted" note so its replies keep their context.
function PlaceComment({
  comment,
  placeId,
  user,
  onVote,
  onChanged,
  isReply = false,
  index = 0,
}) {
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

  // One vote per driver; switching sides moves it, tapping your own vote
  // again takes it back. Casting one pops the filled thumb (.pop, only on
  // the tap) with an Android haptic tick (UI-SUGGESTIONS.md #51).
  const [popped, setPopped] = useState(null);
  const vote = (voteType) => {
    const next = comment.myVote === voteType ? null : voteType;
    setPopped(next);
    tapHaptic();
    onVote(comment._id, next);
  };

  // Replies sit in a well pressed into the comment's card: one raised card
  // per thread, with flat reply rows inside.
  const replies = hasReplies && (
    <Box
      sx={[
        softInset,
        {
          borderRadius: 2,
          mt: 1.5,
          px: 1.5,
          py: 0.5,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5, // replies are told apart by space, not divider lines
        },
      ]}
    >
      {comment.replies.map((reply) => (
        <Box key={reply._id}>
          <PlaceComment
            comment={reply}
            placeId={placeId}
            user={user}
            onVote={onVote}
            onChanged={onChanged}
            isReply
          />
        </Box>
      ))}
    </Box>
  );

  // A top-level card (fading up as the thread loads, app/globals.css `.enter`)
  // or, for a reply, a flat row inside the replies well.
  const shellProps = isReply
    ? { sx: { py: 1.5 } }
    : {
        className: 'enter',
        style: { '--i': index },
        sx: [softRaised, { borderRadius: 3, p: 2, pb: 1.5 }],
      };

  if (comment.deleted) {
    return (
      <Box {...shellProps}>
        <Typography color='text.secondary' sx={{ fontStyle: 'italic', py: 0.5 }}>
          Comment deleted
        </Typography>
        {replies}
      </Box>
    );
  }

  return (
    <Box {...shellProps}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Avatar
          src={comment.author?.image ?? undefined}
          alt=''
          sx={{ width: '2rem', height: '2rem' }}
        />
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant='subtitle2'>{authorName}</Typography>
          <Typography variant='caption' color='text.secondary'>
            {dayjs(comment.created_at).format('MMM D, YYYY')}
            {comment.updated_at && ' · edited'}
          </Typography>
        </Box>
        {/* Edit/delete sit up here, not in the vote row, so that row fits
            a phone without wrapping. */}
        {canManage && !editing && (
          <Box sx={{ display: 'flex', mr: -1 }}>
            <IconButton
              aria-label='Edit comment'
              onClick={startEditing}
              disabled={busy}
              sx={[actionSx, softPressSx]}
            >
              <EditOutlined fontSize='small' />
            </IconButton>
            <IconButton
              aria-label='Delete comment'
              onClick={() => setConfirmOpen(true)}
              disabled={busy}
              sx={[actionSx, softPressSx]}
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
            disabled={busy}
            autoFocus
            fullWidth
            placeholder='Edit your comment'
            slotProps={{
              htmlInput: {
                maxLength: PLACE_COMMENT_MAX_LENGTH,
                'aria-label': 'Edit your comment',
              },
            }}
            sx={softInputSx}
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

      {!editing && (
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            mt: 0.5,
            ml: -1,
          }}
        >
          <IconButton
            aria-label='Upvote comment'
            aria-pressed={comment.myVote === 'up'}
            color={comment.myVote === 'up' ? 'primary' : 'default'}
            onClick={() => vote('up')}
            disabled={busy}
            sx={[actionSx, softPressSx]}
          >
            {comment.myVote === 'up' ? (
              <ThumbUp
                sx={{ fontSize: '1.1rem' }}
                className={popped === 'up' ? 'pop' : undefined}
              />
            ) : (
              <ThumbUpOutlined sx={{ fontSize: '1.1rem' }} />
            )}
          </IconButton>
          <Typography variant='body2' sx={{ minWidth: '1rem' }}>
            {comment.upCount}
          </Typography>
          <IconButton
            aria-label='Downvote comment'
            aria-pressed={comment.myVote === 'down'}
            color={comment.myVote === 'down' ? 'primary' : 'default'}
            onClick={() => vote('down')}
            disabled={busy}
            sx={[actionSx, softPressSx, { ml: 0.5 }]}
          >
            {comment.myVote === 'down' ? (
              <ThumbDown
                sx={{ fontSize: '1.1rem' }}
                className={popped === 'down' ? 'pop' : undefined}
              />
            ) : (
              <ThumbDownOutlined sx={{ fontSize: '1.1rem' }} />
            )}
          </IconButton>
          <Typography variant='body2' sx={{ minWidth: '1rem' }}>
            {comment.downCount}
          </Typography>

          <Button
            size='small'
            startIcon={<Reply />}
            onClick={() => setReplying((open) => !open)}
            disabled={busy}
            sx={[softPressSx, { ml: 1, minHeight: '2.5rem', px: 1.5 }]}
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

      {replying && (
        <Box sx={{ mt: 2 }}>
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

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        fullWidth
        maxWidth='xs'
      >
        <DialogTitle>Delete this comment?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {hasReplies
              ? 'The replies stay, under a "Comment deleted" note.'
              : "This can't be undone."}
          </DialogContentText>
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

export default PlaceComment;
