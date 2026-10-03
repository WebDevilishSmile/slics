'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

import { markPrompted, readDue, snooze } from '@/utils/commentPrompt';

// Asks a driver to leave a tip about the last SLIC they looked up, once they
// come back to the app 15 min – 2 h later (see utils/commentPrompt.js). Checks
// on mount (fresh launch) and whenever the tab/PWA returns to the foreground —
// the usual path is lookup → Maps → drive → back to SLICs.
function CommentPrompt({ user }) {
  const router = useRouter();
  const [due, setDue] = useState(null);
  const checkingRef = useRef(false);

  const check = useCallback(async () => {
    if (checkingRef.current) return;
    const entry = readDue();
    if (!entry) return;

    checkingRef.current = true;
    try {
      // Don't ask about a stop the driver has already written about.
      const response = await fetch(`/api/comments?slic=${entry.numSlic}`);
      if (!response.ok) return; // best-effort: no answer, no prompt
      const data = await response.json();
      // The route answers some failures with a 200 + { error }.
      if (!Array.isArray(data.comments)) return;

      const alreadyCommented = data.comments.some(
        (c) => c.userId?.toString() === user?.id?.toString(),
      );

      markPrompted();
      // No slicName means the SLIC was deleted since the lookup.
      if (!alreadyCommented && data.slicName) {
        setDue({ ...entry, name: entry.name ?? data.slicName });
      }
    } catch (error) {
      console.error('Error checking comment prompt:', error);
    } finally {
      checkingRef.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    check();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [check]);

  const close = () => setDue(null);

  // Centers carry their alpha code ("Bethlehem Center (BETPA)"); customers
  // and older stored entries have alphaSlic null and show the name alone.
  const label = !due
    ? ''
    : due.name && due.alphaSlic
      ? `${due.name} (${due.alphaSlic})`
      : due.name || due.alphaSlic || `SLIC ${due.numSlic}`;

  const handleComment = () => {
    router.push(`/home?slic=${due.numSlic}&comment=1`);
    close();
  };

  const handleSnooze = () => {
    snooze();
    close();
  };

  return (
    <Dialog
      open={!!due}
      onClose={close}
      aria-labelledby='comment-prompt-title'
      fullWidth
      maxWidth='xs'
    >
      <DialogTitle id='comment-prompt-title'>How was {label}?</DialogTitle>
      <DialogContent>
        {due?.name ? (
          <DialogContentText>
            {/* Message for customers */}
            Help the next driver by providing any relevant information about
            this customer. Which entrance to use, security protocols, dock door
            assignments, trailer size limitations, and any other pertinent
            details.
          </DialogContentText>
        ) : (
          <DialogContentText>
            {/* Message for UPS hubs */}
            Help the next driver by providing any relevant information about
            this location. Guard shack instructions, dispatch locations, tricky
            turns — a quick comment helps everyone heading there.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Button onClick={handleSnooze} color='inherit' size='small'>
          Don&apos;t ask for 2 weeks
        </Button>
        <Button onClick={close}>Not now</Button>
        <Button variant='contained' onClick={handleComment}>
          Leave a comment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CommentPrompt;
