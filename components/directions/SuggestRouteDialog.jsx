'use client';

import { useEffect, useId, useState } from 'react';
import { CheckCircleOutline, Close } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import {
  ROUTE_NOTE_MAX_LENGTH,
  ROUTE_TEXT_MAX_LENGTH,
  formatRouteDate,
  mentionsCode,
  parseRoute,
} from '@/lib/routeText';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
} from '@/components/utility/soft';

// What became of the driver's last suggestion for this SLIC.
function LastSuggestion({ mine }) {
  if (!mine) return null;
  const sent = formatRouteDate(mine.updated_at ?? mine.created_at);
  if (mine.status === 'open') {
    return (
      <Alert severity='info'>
        You suggested a change on {sent}. It&apos;s waiting for an admin. Sending again replaces it.
      </Alert>
    );
  }
  if (mine.status === 'approved') {
    return (
      <Alert severity='success'>
        Your suggestion from {sent} was approved on {formatRouteDate(mine.decidedAt)}. Thank you!
      </Alert>
    );
  }
  return (
    <Alert severity='warning'>
      Your suggestion from {sent} wasn&apos;t used
      {mine.answer ? (
        <>
          : <Box component='span' sx={{ whiteSpace: 'pre-wrap' }}>{mine.answer}</Box>
        </>
      ) : (
        '.'
      )}
    </Alert>
  );
}

// "Suggest a change" in the directions sheet, or "Add directions" on a SLIC
// with none (docs/SLIC-DIRECTIONS.md, stage 2). The driver edits the steps
// (prefilled with the current route) and says why; an admin approves or
// declines it on /admin/routes. Plain text. Mounted only while open.
export default function SuggestRouteDialog({ slic, initialText = '', onClose }) {
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [text, setText] = useState(initialText);
  const [note, setNote] = useState('');
  const [mine, setMine] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    let current = true;
    apiRequest(`/api/route-suggestions?slic=${encodeURIComponent(slic.numSlic)}`, { method: 'GET' }).then(
      ({ data }) => {
        if (!current || !data?.mine) return;
        setMine(data.mine);
        // An open suggestion picks up where the driver left off.
        if (data.mine.status === 'open') {
          setText(data.mine.text);
          setNote(data.mine.note);
        }
      },
    );
    return () => {
      current = false;
    };
  }, [slic.numSlic]);

  const steps = parseRoute(text).reduce((sum, section) => sum + section.steps.length, 0);
  const isNew = !initialText;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!steps) return setError('Write at least one step.');
    setSending(true);
    setError('');
    const { error } = await apiRequest('/api/route-suggestions', {
      body: { numSlic: slic.numSlic, text, note },
    });
    setSending(false);
    if (error) return setError(error);
    tapHaptic();
    setSent(true);
  };

  return (
    <Dialog open onClose={sending ? undefined : onClose} fullWidth maxWidth='sm' fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>{isNew ? 'Add directions' : 'Suggest a change'}</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={sending}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent>
        {sent ? (
          <Box
            role='status'
            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5, py: 4, textAlign: 'center' }}
          >
            <CheckCircleOutline color='primary' className='pop' sx={{ fontSize: '2.5rem' }} />
            <Typography>Thanks. An admin will check it, and it&apos;ll show here when they do.</Typography>
          </Box>
        ) : (
          <Box
            component='form'
            id={formId}
            onSubmit={handleSubmit}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
          >
            <Typography variant='body2' color='text.secondary'>
              {isNew
                ? `Know the way to ${slic.alphaSlic || slic.numSlic} in a truck? Write it one step per line.`
                : 'Change the steps below, one per line.'}{' '}
              A line ending in a colon starts another way, such as &ldquo;Way back:&rdquo;. An admin
              checks it before drivers see it.
            </Typography>

            <LastSuggestion mine={mine} />

            <TextField
              label='Steps'
              value={text}
              onChange={(event) => setText(event.target.value)}
              multiline
              minRows={8}
              maxRows={18}
              placeholder={'33 south to 78 east\nTake exit 29 for Rt. 3\nWay back:\nLeft out of the yard'}
              helperText={`${steps} step${steps === 1 ? '' : 's'} · ${text.length}/${ROUTE_TEXT_MAX_LENGTH}`}
              disabled={sending}
              slotProps={{ htmlInput: { maxLength: ROUTE_TEXT_MAX_LENGTH } }}
              sx={softInputSx}
            />
            {mentionsCode(text) && (
              <Alert severity='warning'>
                This looks like it has a gate code. Leave codes out: every driver would see them.
              </Alert>
            )}

            <TextField
              label='Why? (optional)'
              value={note}
              onChange={(event) => setNote(event.target.value)}
              multiline
              minRows={2}
              placeholder='e.g. The ramp at exit 13 is closed, and this way has no low bridges.'
              helperText={`${note.length}/${ROUTE_NOTE_MAX_LENGTH}`}
              disabled={sending}
              slotProps={{ htmlInput: { maxLength: ROUTE_NOTE_MAX_LENGTH } }}
              sx={softInputSx}
            />

            {error && <Alert severity='error'>{error}</Alert>}
          </Box>
        )}
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        {sent ? (
          <Button variant='contained' onClick={onClose} sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}>
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={onClose}
              disabled={sending}
              sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
            >
              Cancel
            </Button>
            <Button
              type='submit'
              form={formId}
              variant='contained'
              disabled={sending || !steps}
              sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
            >
              {sending ? 'Sending…' : 'Send to an admin'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
}
