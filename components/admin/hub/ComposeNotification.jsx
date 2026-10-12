'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { SendOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import { PUSH_COMPOSE_BODY_MAX, PUSH_COMPOSE_TITLE_MAX } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import theme from '@/theme';
import { softContainedSx, softInputSx, softPressSx, softRaisedSmall } from '@/components/utility/soft';
import { plural } from './format';

// "Write your own message" on /admin/super/notifications
// (docs/SUPER-ADMIN-HUB.md stage C, POST /api/push/compose): a title, a line of
// text and the page a tap opens, to every admin with a device or to one. It
// goes past the kinds each admin chose, so it asks first; the server records
// it in admin_audit before sending.
export default function ComposeNotification({ admins, myId }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [to, setTo] = useState('admins');
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const withDevices = admins.filter((admin) => admin.devices.length > 0);
  const recipient = to === 'admins' ? null : admins.find((admin) => admin._id === to);
  const reach =
    to === 'admins'
      ? `every admin with a device (${plural(withDevices.length, 'admin')})`
      : `${recipient?.name ?? 'this admin'}${recipient?.devices.length ? '' : ', who has no device turned on'}`;

  const ask = (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    if (!title.trim()) return setError('Give it a title.');
    setConfirming(true);
  };

  const send = async () => {
    setBusy(true);
    const { data, error: sendError } = await apiRequest('/api/push/compose', {
      body: { title, body, url, to },
    });
    setBusy(false);
    setConfirming(false);
    if (sendError) return setError(sendError);
    setResult(data.data);
    tapHaptic();
    setTitle('');
    setBody('');
    setUrl('');
    // The stats and the send log above and below pick it up.
    router.refresh();
  };

  return (
    <Box
      component='form'
      onSubmit={ask}
      sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, maxWidth: theme.layout.width.prose }}
    >
      <TextField
        sx={softInputSx}
        label='Title'
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        disabled={busy}
        helperText={`${title.length}/${PUSH_COMPOSE_TITLE_MAX}`}
        slotProps={{ htmlInput: { maxLength: PUSH_COMPOSE_TITLE_MAX } }}
      />
      <TextField
        sx={softInputSx}
        label='Text'
        multiline
        minRows={2}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        disabled={busy}
        helperText={`${body.length}/${PUSH_COMPOSE_BODY_MAX}`}
        slotProps={{ htmlInput: { maxLength: PUSH_COMPOSE_BODY_MAX } }}
      />
      <TextField
        sx={softInputSx}
        label='Opens'
        placeholder='/home'
        value={url}
        onChange={(event) => setUrl(event.target.value)}
        disabled={busy}
        helperText='A page on this site, like /admin/reports. Blank opens /home.'
        slotProps={{ htmlInput: { maxLength: 300, spellCheck: false, autoCapitalize: 'none' } }}
      />
      <TextField
        sx={softInputSx}
        select
        label='Send to'
        value={to}
        onChange={(event) => setTo(event.target.value)}
        disabled={busy}
      >
        <MenuItem value='admins'>Every admin with a device</MenuItem>
        {admins.map((admin) => (
          <MenuItem key={admin._id} value={admin._id}>
            {admin.name}
            {admin._id === myId ? ' (you)' : ''}
            {admin.devices.length === 0 ? ' · no device' : ''}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant='body2' color='text.secondary'>
        Lock screens aren&apos;t private: no addresses, phone numbers or drivers&apos; names.
      </Typography>

      {error && <Alert severity='error'>{error}</Alert>}
      {result && (
        <Alert severity={result.sent > 0 ? 'success' : 'warning'}>
          {result.sent > 0
            ? `Sent to ${plural(result.sent, 'device')}${result.failed ? `; ${result.failed} failed` : ''}.`
            : 'No device took it: nobody it was for has notifications on.'}
        </Alert>
      )}

      <Box>
        <Button
          type='submit'
          variant='contained'
          disabled={busy}
          startIcon={<SendOutlined />}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Send
        </Button>
      </Box>

      <Dialog open={confirming} onClose={() => !busy && setConfirming(false)} fullWidth maxWidth='xs'>
        <DialogTitle>Send this notification?</DialogTitle>
        <DialogContent>
          <Typography>
            &ldquo;{title.trim()}&rdquo; goes to {reach}, whatever kinds they chose.
          </Typography>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirming(false)}
            disabled={busy}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={send}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
