'use client';

import { useId, useState } from 'react';
import Link from '@/components/utility/NextLink';
import dayjs from 'dayjs';
import { ChevronRightOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  TextField,
  Typography,
} from '@mui/material';

import { apiRequest } from '@/lib/apiRequest';
import { setOpenDisputesCount } from '@/lib/coverDisputesStore';
import { formatWeekEnding } from '@/lib/onCallSheet';
import { COVER_DISPUTE_NOTE_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';
import { displayName } from '@/lib/names';

const when = (iso) => (iso ? dayjs(iso).format('MMM D, YYYY h:mm A') : '');
const softButtonSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }];
const weekLabels = (weeks) => weeks.map((week) => `W/E ${formatWeekEnding(week)}`).join(', ');

function OpenDispute({ dispute, index, busy, onClose }) {
  const account = dispute.account;
  // The account may have been re-linked since the driver wrote.
  const relinked = account?.driverName && account.driverName !== dispute.driverName;

  return (
    <Box
      component='li'
      className='enter'
      sx={[
        softRaised,
        { '--i': index, borderRadius: 4, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 },
      ]}
    >
      <Box>
        <Typography variant='h6' component='h3'>
          {account?.name || 'Deleted account'}
        </Typography>
        <Typography variant='caption' color='text.secondary' component='p'>
          {account?.email ? `${account.email} · ` : ''}Sent {when(dispute.updated_at ?? dispute.created_at)}
        </Typography>
      </Box>

      <Box sx={[softInset, { borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }]}>
        <Typography variant='body2'>
          Linked to <strong>{displayName(dispute.driverName)}</strong>
          {relinked && ` (now ${displayName(account.driverName)})`}, not on {weekLabels(dispute.weeks)}.
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {dispute.jobName
            ? `On the Jobs tab as ${dispute.jobName}.`
            : 'Not on the Jobs tab.'}
        </Typography>
        {dispute.note ? (
          // Plain text, never HTML.
          <Typography variant='body2' sx={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
            &ldquo;{dispute.note}&rdquo;
          </Typography>
        ) : (
          <Typography variant='body2' color='text.secondary'>
            No note.
          </Typography>
        )}
      </Box>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5 }}>
        {account && (
          <Button
            component={Link}
            href={`/admin/users/${account._id}`}
            endIcon={<ChevronRightOutlined />}
            sx={softButtonSx}
          >
            Account
          </Button>
        )}
        <Button
          variant='contained'
          onClick={() => onClose(dispute)}
          disabled={busy}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Close
        </Button>
      </Box>
    </Box>
  );
}

// The answer the driver sees on /covers. Mounted only while open.
function CloseDialog({ dispute, busy, error, onCancel, onConfirm }) {
  const formId = useId();
  const [reply, setReply] = useState('');

  return (
    <Dialog open onClose={busy ? undefined : onCancel} fullWidth maxWidth='xs'>
      <DialogTitle>Close {dispute.account?.name || 'this dispute'}?</DialogTitle>
      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(dispute, reply);
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            Fix the sheet or the account&apos;s link first. The driver sees your
            answer on the Covers page and can write again.
          </Typography>
          <TextField
            sx={softInputSx}
            label='Answer (optional)'
            multiline
            minRows={2}
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            placeholder="e.g. You hold a bid job this week, so you're not on the cover list."
            helperText={`${reply.length}/${COVER_DISPUTE_NOTE_MAX_LENGTH}`}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: COVER_DISPUTE_NOTE_MAX_LENGTH } }}
          />
          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onCancel} disabled={busy} sx={softButtonSx}>
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={busy}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// Verified drivers who say they should be on the week's cover list ("This is
// a mistake" on /covers, lib/db/coverDisputes.js): open ones oldest first,
// then the last few closed. The fix is the sheet's, or the account's link on
// its admin user page; Close sends the driver an answer. Renders nothing
// when there are none.
export default function CoverDisputesList({ initialOpen, initialClosed }) {
  const [open, setOpen] = useState(initialOpen);
  const [closed, setClosed] = useState(initialClosed);
  const [closing, setClosing] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (open.length === 0 && closed.length === 0) return null;

  const close = async (dispute, reply) => {
    setBusy(true);
    setError('');
    const { data, error } = await apiRequest(`/api/cover-disputes/${dispute._id}`, {
      method: 'PATCH',
      body: { status: 'closed', reply },
    });
    setBusy(false);
    if (error) return setError(error);

    const nextOpen = open.filter((item) => item._id !== dispute._id);
    setOpen(nextOpen);
    setClosed([data.data, ...closed]);
    setOpenDisputesCount(nextOpen.length);
    setClosing(null);
  };

  return (
    <Paper
      variant='panel'
      component='section'
      aria-labelledby='cover-disputes'
      sx={{ minHeight: 0, alignItems: 'stretch', gap: 3, px: 2, mb: 3 }}
    >
      <Box>
        <Typography id='cover-disputes' variant='h5' component='h2' sx={{ fontWeight: 800 }}>
          Not on the cover list?
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          Verified drivers who say they should be on a posted week&apos;s list.
        </Typography>
      </Box>

      {open.length === 0 ? (
        <Typography color='text.secondary'>None open.</Typography>
      ) : (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5 }}>
          {open.map((dispute, index) => (
            <OpenDispute
              key={dispute._id}
              dispute={dispute}
              index={index}
              busy={busy}
              onClose={(item) => {
                setError('');
                setClosing(item);
              }}
            />
          ))}
        </Box>
      )}

      {closed.length > 0 && (
        <Box component='section' aria-labelledby='closed-disputes'>
          <Typography id='closed-disputes' variant='subtitle1' component='h3' sx={{ mb: 1.5 }}>
            Recently closed
          </Typography>
          <Box
            component='ul'
            sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 4, display: 'grid', gap: 1 }]}
          >
            {closed.map((dispute) => (
              <Box component='li' key={dispute._id} sx={{ p: 1 }}>
                <Typography variant='body2'>
                  <strong>{dispute.account?.name || displayName(dispute.driverName)}</strong> ·{' '}
                  {displayName(dispute.driverName)}
                </Typography>
                {dispute.reply && (
                  // Plain text, never HTML.
                  <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
                    {dispute.reply}
                  </Typography>
                )}
                <Typography variant='caption' color='text.secondary'>
                  {dispute.closedBy ? `By ${dispute.closedBy} · ` : ''}
                  {when(dispute.closed_at)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {closing && (
        <CloseDialog
          dispute={closing}
          busy={busy}
          error={error}
          onCancel={() => setClosing(null)}
          onConfirm={close}
        />
      )}
    </Paper>
  );
}
