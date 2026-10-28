'use client';

import { useId, useState } from 'react';
import dayjs from 'dayjs';
import {
  CheckCircleOutline,
  HourglassTopOutlined,
  QuestionAnswerOutlined,
  VisibilityOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { COVER_DISPUTE_NOTE_MAX_LENGTH } from '@/constants';
import SoftNotice from '@/components/utility/SoftNotice';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

const softButtonSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }];

// "10/17/2026", "10/17/2026 and 10/24/2026", "10/17/2026, 10/24/2026 and …".
function weekList(weeks) {
  const dates = weeks.map(formatWeekEnding);
  return dates.length < 2 ? dates.join('') : `${dates.slice(0, -1).join(', ')} and ${dates.at(-1)}`;
}

// The message to the admins. Mounted only while open. The server reads the
// weeks and the linked name itself; the driver only adds a note.
function DisputeDialog({ driverName, onClose, onSent }) {
  const formId = useId();
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError('');
    const { data, error } = await apiRequest('/api/cover-disputes', { body: { note } });
    setSending(false);
    if (error) return setError(error);
    tapHaptic();
    onSent(data.data);
  };

  return (
    <Dialog open onClose={sending ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Tell an admin</DialogTitle>
      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            An admin checks the on-call sheet and the name your account is linked
            to{driverName ? ` (${driverName})` : ''}, then answers you here.
          </Typography>
          <TextField
            sx={softInputSx}
            label='Anything that helps (optional)'
            multiline
            minRows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. I'm cover 7 this week."
            helperText={`${note.length}/${COVER_DISPUTE_NOTE_MAX_LENGTH}`}
            disabled={sending}
            slotProps={{ htmlInput: { maxLength: COVER_DISPUTE_NOTE_MAX_LENGTH } }}
          />
          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} disabled={sending} sx={softButtonSx}>
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={sending}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Covers read only (docs/COVER-BIDDING.md): a verified driver the posted pick
// list leaves off (lib/coverDrivers.js offListWeeks) isn't a cover or on-call
// driver that week, so they see the jobs but can't keep a list or pick.
// "This is a mistake" tells the admins (lib/db/coverDisputes.js).
// - `offWeeks`: the posted weeks they're off, which the notice names: the
//   week /covers shows (lib/bidDay.js currentBidWeek).
// - `jobCode`: the job they hold on the Jobs tab ("BMEL"), or null.
// - `initialDispute`: their latest message (getMyCoverDispute) or null. While
//   it's open the button is replaced by when they sent it; once it's closed,
//   the admin's answer shows and they can send another.
export default function CoverDispute({ offWeeks, driverName, jobCode, initialDispute }) {
  const [dispute, setDispute] = useState(initialDispute);
  const [open, setOpen] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const waiting = dispute?.status === 'open';
  const answered = dispute?.status === 'closed';
  const scope = ` for the week ending ${weekList(offWeeks)}`;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <SoftNotice
        icon={<VisibilityOutlined />}
        actions={
          waiting ? null : (
            <Button onClick={() => setOpen(true)} sx={[softButtonSx, { ml: 1 }]}>
              This is a mistake
            </Button>
          )
        }
      >
        <strong>The cover list is read only for you.</strong>
        {jobCode && (
          <>
            {' '}Your current job code is <strong>{jobCode}</strong>.
          </>
        )}{' '}
        You&apos;re not a cover or on-call driver{scope}, so you can see the
        jobs but can&apos;t pick them or keep a list.
      </SoftNotice>

      {waiting && (
        <SoftNotice icon={<HourglassTopOutlined />}>
          You told an admin on {dayjs(dispute.sent_at).format('MMM D, YYYY')}. They&apos;ll
          check the sheet and answer here.
        </SoftNotice>
      )}

      {answered && (
        <SoftNotice icon={<QuestionAnswerOutlined />}>
          An admin looked into your last message on{' '}
          {dayjs(dispute.closed_at).format('MMM D, YYYY')}
          {dispute.reply ? (
            // Plain text, never HTML.
            <Box component='span' sx={{ display: 'block', mt: 0.5, whiteSpace: 'pre-wrap' }}>
              {dispute.reply}
            </Box>
          ) : (
            '.'
          )}
        </SoftNotice>
      )}

      <Box role='status' aria-live='polite'>
        {justSent && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <CheckCircleOutline fontSize='small' color='primary' className='pop' />
            Sent. An admin will check it.
          </Typography>
        )}
      </Box>

      {open && (
        <DisputeDialog
          driverName={driverName}
          onClose={() => setOpen(false)}
          onSent={(saved) => {
            setOpen(false);
            setDispute(saved);
            setJustSent(true);
          }}
        />
      )}
    </Box>
  );
}
