'use client';

import { useId, useState } from 'react';
import { Close } from '@mui/icons-material';
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
import { formatWeekEnding } from '@/lib/onCallSheet';
import { COVER_REPORT_KINDS, COVER_REPORT_NOTE_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';

// "Report a problem" on /covers (lib/db/coverReports.js): what's off about
// the week on screen, an optional job number and a note. Mounted only while
// open, so each opening starts empty. In the super admin's preview nothing is
// sent: `preview` shows the form and says so.
export default function CoverReportDialog({ weekEnding, preview = false, onClose, onSent }) {
  const formId = useId();
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [kind, setKind] = useState(null);
  const [jobNumber, setJobNumber] = useState('');
  const [note, setNote] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const needsNote = COVER_REPORT_KINDS.find((option) => option.value === kind)?.needsNote;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!kind) return setError("Pick what's wrong.");
    if (needsNote && !note.trim()) return setError("Add a note saying what's wrong.");
    if (preview) return setError("This is a preview: the report isn't sent.");

    setSending(true);
    setError('');
    const { error } = await apiRequest('/api/cover-reports', {
      body: { weekEnding, kind, jobNumber, note },
    });
    setSending(false);
    if (error) return setError(error);
    tapHaptic();
    onSent();
  };

  return (
    <Dialog open onClose={sending ? undefined : onClose} fullWidth maxWidth='xs' fullScreen={fullScreen}>
      <DialogTitle sx={{ pr: 7 }}>Report a problem</DialogTitle>
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
            Tell the admin what doesn&apos;t match the on-call sheet or dispatch for the week ending{' '}
            {formatWeekEnding(weekEnding)}. Only admins see reports.
          </Typography>

          <Box>
            <FormLabel id={`${formId}-kind`} required sx={{ typography: 'body2', fontWeight: 500 }}>
              What&apos;s wrong?
            </FormLabel>
            <Box
              role='group'
              aria-labelledby={`${formId}-kind`}
              sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.5 }}
            >
              {COVER_REPORT_KINDS.map(({ value, label }) => (
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
            label='Job number (optional)'
            value={jobNumber}
            onChange={(event) => setJobNumber(event.target.value.toUpperCase())}
            placeholder='e.g. SH14'
            disabled={sending}
            slotProps={{ htmlInput: { maxLength: 12, autoCapitalize: 'characters' } }}
          />

          <TextField
            sx={softInputSx}
            label={needsNote ? 'Note' : 'Note (optional)'}
            required={Boolean(needsNote)}
            multiline
            minRows={3}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder='e.g. Dispatch says SH14 starts at 21:00, not 22:00'
            helperText={`${note.length}/${COVER_REPORT_NOTE_MAX_LENGTH}`}
            disabled={sending}
            slotProps={{ htmlInput: { maxLength: COVER_REPORT_NOTE_MAX_LENGTH } }}
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
