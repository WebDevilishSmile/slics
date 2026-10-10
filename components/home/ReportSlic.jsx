'use client';

import { useId, useState } from 'react';
import { CheckCircleOutline, Close, OutlinedFlag } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormLabel,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';

import theme from '@/theme';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { SLIC_REPORT_KINDS, SLIC_REPORT_NOTE_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';

// The report form. Mounted only while open, so each opening starts empty.
function ReportDialog({ slic, onClose, onSent }) {
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [kind, setKind] = useState(null);
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const needsNote = SLIC_REPORT_KINDS.find((option) => option.value === kind)?.needsNote;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!kind) return setError("Pick what's wrong.");
    if (needsNote && !note.trim()) return setError("Add a note saying what's wrong.");

    setSending(true);
    setError('');
    const { error } = await apiRequest('/api/slic-reports', {
      body: { numSlic: slic.numSlic, kind, note },
    });
    setSending(false);
    if (error) return setError(error);
    tapHaptic();
    onSent();
  };

  return (
    <Dialog
      open
      onClose={sending ? undefined : onClose}
      fullWidth
      maxWidth='xs'
      fullScreen={fullScreen}
    >
      <DialogTitle sx={{ pr: 7 }}>Something wrong?</DialogTitle>
      <IconButton
        onClick={onClose}
        disabled={sending}
        aria-label='Close'
        sx={[softPressSx, { position: 'absolute', top: '0.75rem', right: '0.75rem' }]}
      >
        <Close />
      </IconButton>

      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={handleSubmit}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            Tell the admin what&apos;s off about {slic.name || slic.alphaSlic} (
            {slic.numSlic}). It gets checked and fixed for every driver.
          </Typography>

          <Box>
            <FormLabel
              id={`${formId}-kind`}
              required
              sx={{ typography: 'body2', fontWeight: 500 }}
            >
              What&apos;s wrong?
            </FormLabel>
            <Box
              role='group'
              aria-labelledby={`${formId}-kind`}
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}
            >
              {SLIC_REPORT_KINDS.map(({ value, label }) => (
                <Chip
                  key={value}
                  size='medium'
                  label={label}
                  onClick={() => {
                    setKind(value);
                    setError('');
                  }}
                  aria-pressed={kind === value}
                  disabled={sending}
                  sx={softToggleSx}
                />
              ))}
            </Box>
          </Box>

          <TextField
            sx={softInputSx}
            label={needsNote ? 'Note' : 'Note (optional)'}
            required={Boolean(needsNote)}
            multiline
            minRows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder='e.g. The new number is 717-555-0100'
            helperText={`${note.length}/${SLIC_REPORT_NOTE_MAX_LENGTH}`}
            disabled={sending}
            slotProps={{ htmlInput: { maxLength: SLIC_REPORT_NOTE_MAX_LENGTH } }}
          />

          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>

      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
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
          disabled={sending}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {sending ? 'Sending…' : 'Send report'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// "Something wrong with this SLIC?" under the lookup card (RECOMMENDATIONS.md
// #5). Sending confirms in place: the link turns into a thank-you, announced
// politely. Keyed by numSlic in SlicDisplay, so another SLIC starts fresh.
export default function ReportSlic({ slic }) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);

  return (
    <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2.5 }}>
      <Box role='status' aria-live='polite'>
        {sent && (
          <Typography
            variant='body2'
            color='text.secondary'
            sx={{ display: 'flex', alignItems: 'center', gap: 1, minHeight: '3rem' }}
          >
            <CheckCircleOutline fontSize='small' color='primary' className='pop' />
            Thanks. An admin will check it.
          </Typography>
        )}
      </Box>
      {!sent && (
        <Button
          size='small'
          startIcon={<OutlinedFlag />}
          onClick={() => setOpen(true)}
          sx={[softPressSx, { px: 2, minHeight: '3rem', color: 'text.secondary' }]}
        >
          Something wrong with this SLIC?
        </Button>
      )}

      {open && (
        <ReportDialog
          slic={slic}
          onClose={() => setOpen(false)}
          onSent={() => {
            setOpen(false);
            setSent(true);
          }}
        />
      )}
    </Box>
  );
}
