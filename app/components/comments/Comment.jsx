'use client';

import { useEffect, useRef, useState } from 'react';
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
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/utils/apiRequest';
import { tapHaptic } from '@/utils/clientFunctions';
import { SLIC_COMMENT_MAX_LENGTH } from '@/utils/variables';

import CommentComposer from './CommentComposer';
import CommentContent, { commentToText } from './CommentContent';
import VotersDialog from './VotersDialog';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '../utility/soft';

dayjs.extend(relativeTime);

// 40px vote targets (UI-SUGGESTIONS.md #45): padding, not bigger icons.
const voteSx = { width: '2.5rem', height: '2.5rem' };

// One tip: a soft raised card (utility/soft.js) holding its replies in a
// pressed-in well, or, for a reply, a flat row inside that well. Threads
// are one level deep: "Reply" on a reply posts into the same thread. A
// top-level tip deleted while it had replies renders as "Comment deleted" so
// the replies keep their context.
function Comment({
  comment,
  numSlic,
  user,
  isNew,
  onVote,
  onChanged,
  isReply = false,
  index = 0,
  justPosted = null,
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [replying, setReplying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [votersOpen, setVotersOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const shellRef = useRef(null);

  // A tip just posted can sort below the fold (a new tip has no votes), so
  // bring it into view for its tint. Smooth unless reduced motion is on.
  useEffect(() => {
    if (comment._id !== justPosted || !shellRef.current) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    shellRef.current.scrollIntoView({
      behavior: reduce ? 'auto' : 'smooth',
      block: 'nearest',
    });
  }, [comment._id, justPosted]);

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
    const { error: message } = await apiRequest(
      `/api/comments/${comment._id}`,
      {
        method: 'PATCH',
        body: { content: draft },
      },
    );
    setSaving(false);
    if (message) return setError(message);
    setEditing(false);
    await onChanged();
  };

  const handleDelete = async () => {
    setSaving(true);
    setError('');
    const { error: message } = await apiRequest(
      `/api/comments/${comment._id}`,
      {
        method: 'DELETE',
      },
    );
    setSaving(false);
    setConfirmOpen(false);
    if (message) return setError(message);
    await onChanged();
  };

  // Tapping your own vote again takes it back.
  // Tap feedback (UI-SUGGESTIONS.md #51): casting a vote pops the filled thumb
  // (.pop, only on the tap, never on load) and gives an Android haptic tick.
  const [popped, setPopped] = useState(null);
  const vote = (voteType) => {
    const next = comment.myVote === voteType ? null : voteType;
    setPopped(next);
    tapHaptic();
    onVote(comment, next);
  };

  // Replies sit in a well pressed into the tip's card: one raised card per
  // thread, with flat reply rows inside, rather than cards stacked on cards.
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
          <Comment
            comment={reply}
            numSlic={numSlic}
            user={user}
            isNew={isNew}
            onVote={onVote}
            onChanged={onChanged}
            justPosted={justPosted}
            isReply
          />
        </Box>
      ))}
    </Box>
  );

  const replyBox = replying && (
    <Box sx={{ mt: 2 }}>
      <CommentComposer
        numSlic={numSlic}
        parentId={comment._id}
        label={`Reply to ${authorName}`}
        autoFocus
        onCancel={() => setReplying(false)}
        onPosted={async (id) => {
          setReplying(false);
          await onChanged(id);
        }}
      />
    </Box>
  );

  // A top-level card or, for a reply, a flat row inside the replies well.
  const shellSx = isReply
    ? { py: 1.5, position: 'relative' }
    : [softRaised, { borderRadius: 3, p: 2, pb: 1.5, position: 'relative' }];

  // Entry and "just posted" animations (UI-SUGGESTIONS.md #49, app/globals.css):
  // top-level cards fade up as the list loads, staggered by `index`; the tip
  // or reply the driver just posted gets a fading brand-blue tint.
  const isJustPosted = comment._id === justPosted;
  const shellProps = {
    ref: shellRef,
    className: [isReply ? '' : 'enter', isJustPosted ? 'just-posted' : '']
      .filter(Boolean)
      .join(' ') || undefined,
    style: isReply ? undefined : { '--i': index },
  };

  if (comment.deleted) {
    return (
      <Box sx={shellSx} {...shellProps}>
        <Typography
          color='text.secondary'
          sx={{ fontStyle: 'italic', py: 0.5 }}
        >
          Comment deleted
        </Typography>
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
    <Box sx={shellSx} {...shellProps}>
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
            <IconButton
              aria-label='Edit tip'
              onClick={startEditing}
              sx={[voteSx, softPressSx]}
            >
              <EditOutlined fontSize='small' />
            </IconButton>
            <IconButton
              aria-label='Delete tip'
              onClick={() => setConfirmOpen(true)}
              sx={[voteSx, softPressSx]}
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
            placeholder='Edit your tip'
            slotProps={{
              htmlInput: {
                maxLength: SLIC_COMMENT_MAX_LENGTH,
                'aria-label': 'Edit your tip',
              },
            }}
            sx={softInputSx}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button
              onClick={() => setEditing(false)}
              disabled={saving}
              sx={[softRaisedSmall, softPressSx, { px: 2 }]}
            >
              Cancel
            </Button>
            <Button
              variant='contained'
              onClick={handleSave}
              disabled={saving || !draft.trim()}
              sx={softContainedSx}
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
            aria-label='Helpful'
            aria-pressed={comment.myVote === 'up'}
            color={comment.myVote === 'up' ? 'primary' : 'default'}
            onClick={() => vote('up')}
            sx={[voteSx, softPressSx]}
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
          {count(comment.upCount, 'found this helpful')}
          <IconButton
            aria-label='Not helpful'
            aria-pressed={comment.myVote === 'down'}
            color={comment.myVote === 'down' ? 'primary' : 'default'}
            onClick={() => vote('down')}
            sx={[voteSx, softPressSx, { ml: 0.5 }]}
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
          {count(comment.downCount, 'found this not helpful')}

          <Button
            size='small'
            startIcon={<Reply />}
            onClick={() => setReplying((open) => !open)}
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

export default Comment;
