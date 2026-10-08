'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Box,
  Paper,
  Skeleton,
  Snackbar,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { readTipsSeen, setTips, writeTipsSeen } from '@/lib/tipsStore';
import { COMMENTS_SECTION_ID } from '@/constants';

import Comment from './Comment';
import CommentComposer from './CommentComposer';
import NoSlicComments from './NoSlicComments';
import { softInset, softRaised, softRaisedSmall } from '@/components/utility/soft';

const time = (value) => new Date(value).getTime() || 0;

// Applies `fn` to the comment or reply with this id.
const updateInThread = (thread, id, fn) =>
  thread.map((comment) =>
    comment._id === id
      ? fn(comment)
      : { ...comment, replies: comment.replies.map((reply) => (reply._id === id ? fn(reply) : reply)) },
  );

// Moves the viewer's vote to `next` ('up' | 'down' | null) and fixes the counts.
const withVote = (comment, next) => ({
  ...comment,
  myVote: next,
  upCount: comment.upCount - (comment.myVote === 'up') + (next === 'up'),
  downCount: comment.downCount - (comment.myVote === 'down') + (next === 'down'),
});

const liveCount = (thread) =>
  thread.reduce((n, comment) => n + (comment.deleted ? 0 : 1) + comment.replies.length, 0);

// The "Driver tips" section under the lookup card on /home (and /all): an
// always-visible composer with topic starters, the threaded tips sorted Top or
// Newest, and "New" marks for tips posted since this device last showed them
// (UI-SUGGESTIONS.md #45). The SLIC comes from ?slic= in the URL.
function Comments({ user }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const numSlic = searchParams.get('slic');

  const [thread, setThread] = useState(null); // null while loading
  const [slicName, setSlicName] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [sort, setSort] = useState('top');
  const [seenBefore, setSeenBefore] = useState(null);
  const [snack, setSnack] = useState(null); // { message, severity }
  const sectionRef = useRef(null);
  const composerRef = useRef(null);

  const fetchThread = useCallback(async () => {
    if (!numSlic) return;
    const { data, error } = await apiRequest(
      `/api/comments?slic=${encodeURIComponent(numSlic)}`,
      { method: 'GET' },
    );
    if (error) {
      setLoadError(error);
      setThread((current) => current ?? []);
      return;
    }
    setLoadError('');
    setThread(data.comments);
    setSlicName(data.slicName);
  }, [numSlic]);

  // Reload after a change. A post passes its new id, which marks that tip or
  // reply "just posted" for the tint in comments/Comment.jsx (UI-SUGGESTIONS.md
  // #49); the mark clears once the 1.8s animation is done, so it can play again.
  const [justPosted, setJustPosted] = useState(null);
  const refresh = useCallback(
    async (id) => {
      await fetchThread();
      if (id) setJustPosted(id);
    },
    [fetchThread],
  );
  useEffect(() => {
    if (!justPosted) return undefined;
    const timer = setTimeout(() => setJustPosted(null), 2000);
    return () => clearTimeout(timer);
  }, [justPosted]);

  // A new SLIC: start over. "New" is relative to the last time this device
  // showed this SLIC's tips; on a first visit nothing is new, and this visit
  // becomes the baseline.
  useEffect(() => {
    setThread(null);
    setSlicName(null);
    setLoadError('');
    if (!numSlic) return;
    const seen = readTipsSeen(numSlic);
    setSeenBefore(seen);
    if (!seen) writeTipsSeen(numSlic);
    fetchThread();
  }, [numSlic, fetchThread]);

  const isNew = useCallback(
    (comment) =>
      Boolean(seenBefore) &&
      !comment.isMine &&
      !comment.deleted &&
      time(comment.created_at) > time(seenBefore),
    [seenBefore],
  );

  const newCount = useMemo(
    () =>
      (thread ?? []).reduce(
        (n, comment) => n + isNew(comment) + comment.replies.filter(isNew).length,
        0,
      ),
    [thread, isNew],
  );

  // Share the counts with the lookup card's Tips button.
  useEffect(() => {
    if (numSlic && thread) setTips({ numSlic, total: liveCount(thread), newCount });
  }, [numSlic, thread, newCount]);

  // Once the tips are actually on screen, they count as seen: the Tips button
  // drops its "new" count, and next visit only later tips are new. This
  // visit's "New" marks stay put so the driver can still spot them.
  useEffect(() => {
    if (!numSlic || !thread || !seenBefore || !sectionRef.current) return undefined;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        writeTipsSeen(numSlic);
        setTips({ numSlic, newCount: 0 });
        observer.disconnect();
      },
      // Seen once the section's top is in the upper 60% of the screen. A
      // ratio threshold wouldn't do: a long thread is taller than a phone, so
      // a fixed share of it may never be visible at once.
      { threshold: 0, rootMargin: '0px 0px -40% 0px' },
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [numSlic, thread, seenBefore]);

  // ?comment=1 comes from the comment prompt (CommentPrompt.jsx): bring the
  // composer into view and focus it, then drop the flag so a refresh doesn't
  // repeat it.
  useEffect(() => {
    if (searchParams.get('comment') !== '1' || !numSlic) return;
    sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    composerRef.current?.focus();
    router.replace(`/home?slic=${numSlic}`, { scroll: false });
  }, [searchParams, numSlic, router]);

  // Optimistic: the counts and the pressed state change on tap. The list isn't
  // re-sorted until the next load, so a tip doesn't jump away under a thumb.
  const handleVote = useCallback(
    async (comment, next) => {
      const previous = comment.myVote;
      setThread((current) => updateInThread(current, comment._id, (c) => withVote(c, next)));
      const { error } = await apiRequest(`/api/comments/${comment._id}/vote`, {
        body: { voteType: next },
      });
      if (error) {
        setThread((current) =>
          updateInThread(current, comment._id, (c) => withVote(c, previous)),
        );
        setSnack({ message: "Couldn't save your vote. Please try again.", severity: 'error' });
      }
    },
    [],
  );

  const sorted = useMemo(() => {
    if (!thread || sort === 'top') return thread;
    return [...thread].sort((a, b) => time(b.created_at) - time(a.created_at));
  }, [thread, sort]);

  if (!numSlic) return <NoSlicComments />;

  const total = thread ? liveCount(thread) : 0;
  const stop = slicName || 'this stop';

  return (
    <Paper
      id={COMMENTS_SECTION_ID}
      ref={sectionRef}
      variant='panel'
      sx={{
        px: 2, // tighter than the panel default so tip cards get the width
        alignItems: 'stretch',
        gap: 2,
        scrollMarginTop: '6rem', // breathing room when the Tips button scrolls here
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography variant='h4' component='h2' sx={{ fontWeight: 700, flex: 1 }}>
          Driver tips
          {total > 0 && (
            <Typography component='span' variant='h6' color='text.secondary' sx={{ ml: 1 }}>
              {total}
            </Typography>
          )}
        </Typography>
        {thread?.length > 1 && (
          <ToggleButtonGroup
            size='small'
            exclusive
            value={sort}
            onChange={(_event, value) => value && setSort(value)}
            aria-label='Sort tips'
            // A soft segmented control: a pressed-in track with the chosen
            // option raised out of it (utility/soft.js).
            sx={[
              softInset,
              (theme) => ({
                borderRadius: 999,
                p: 0.5,
                gap: 0.5,
                '& .MuiToggleButtonGroup-grouped': {
                  border: 0,
                  borderRadius: '999px !important',
                  textTransform: 'none',
                  px: 1.5,
                  '&.Mui-selected': {
                    ...softRaisedSmall(theme),
                    color: theme.vars.palette.primary.main,
                  },
                },
              }),
            ]}
          >
            <ToggleButton value='top'>Top</ToggleButton>
            <ToggleButton value='newest'>Newest</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>

      <CommentComposer
        ref={composerRef}
        numSlic={numSlic}
        topics
        placeholder={`Share a tip about ${stop}`}
        onPosted={async (id) => {
          await refresh(id);
          setSnack({ message: 'Thanks! Your tip is posted.', severity: 'success' });
        }}
      />

      {loadError && <Alert severity='error'>{loadError}</Alert>}

      {thread === null ? (
        // Two tip-shaped skeletons in the soft card shape (UI-SUGGESTIONS.md #43).
        <Box
          aria-busy='true'
          aria-label='Loading tips'
          sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}
        >
          {[0, 1].map((card) => (
            <Box key={card} sx={[softRaised, { borderRadius: 3, p: 2 }]}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Skeleton variant='circular' width='2rem' height='2rem' />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant='text' sx={{ width: '30%' }} />
                  <Skeleton variant='text' sx={{ width: '20%' }} />
                </Box>
              </Box>
              <Skeleton variant='text' sx={{ mt: 1 }} />
              <Skeleton variant='text' sx={{ width: '70%' }} />
            </Box>
          ))}
        </Box>
      ) : sorted.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Typography variant='h6' component='p' sx={{ mb: 1 }}>
            No tips yet for {stop}
          </Typography>
          <Typography color='text.secondary'>
            Be the first. Gate codes, where to park, which door: whatever helps the next
            driver.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {sorted.map((comment, index) => (
            <Comment
              key={comment._id}
              comment={comment}
              numSlic={numSlic}
              user={user}
              isNew={isNew}
              onVote={handleVote}
              onChanged={refresh}
              index={index}
              justPosted={justPosted}
            />
          ))}
        </Box>
      )}

      <Snackbar open={Boolean(snack)} onClose={() => setSnack(null)}>
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)}>
          {snack?.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default Comments;
