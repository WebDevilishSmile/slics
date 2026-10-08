'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Button,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';

import { markPrompted, readDue, snooze } from '@/lib/commentPrompt';
import BottomSheetDialog, {
  BottomSheetActions,
} from '../utility/BottomSheetDialog';
import {
  softContainedSx,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

// Asks a driver to leave a tip about the last SLIC they looked up, once they
// come back to the app 15 min – 4 h later (see lib/commentPrompt.js). Checks
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

      // The thread marks the viewer's own tips and replies with `isMine`.
      const alreadyCommented = data.comments.some(
        (c) => c.isMine || c.replies?.some((reply) => reply.isMine),
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
  }, []);

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
    <BottomSheetDialog
      open={!!due}
      onClose={close}
      aria-labelledby='comment-prompt-title'
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
      {/* "Don't ask" silences the prompt for two weeks, so it sits apart,
          a flat text button below a gap, rather than next to "Not now". */}
      <BottomSheetActions>
        <Button
          variant='contained'
          size='large'
          onClick={handleComment}
          sx={softContainedSx}
        >
          Leave a tip
        </Button>
        <Button
          size='large'
          onClick={close}
          sx={[softRaisedSmall, softPressSx]}
        >
          Not now
        </Button>
        <Button
          color='inherit'
          onClick={handleSnooze}
          sx={[softPressSx, { mt: 1 }]}
        >
          Don&apos;t ask again for 2 weeks
        </Button>
      </BottomSheetActions>
    </BottomSheetDialog>
  );
}

export default CommentPrompt;
