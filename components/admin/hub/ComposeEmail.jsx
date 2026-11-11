'use client';

import { useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DarkModeOutlined, LightModeOutlined, SendOutlined } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Switch,
  TextField,
  Typography,
} from '@mui/material';

import {
  COMPOSE_EMAIL_FROM_NAME,
  COMPOSE_EMAIL_LIMITS as LIMITS,
  COMPOSE_EMAIL_SIGN_OFF,
  CONTACT_EMAIL,
  SITE_URL,
} from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { composedEmail, validateComposedEmail } from '@/lib/composedEmail';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';

// The compose form on /admin/super/email (POST /api/emails): who it's to, the
// subject, an optional heading, the message, an optional button and note, and
// the sign-off, with a live preview rendered by the same code the server
// sends (lib/composedEmail.js). The draft is kept in this browser until it's
// sent, so leaving the page doesn't lose it.

const EMPTY = {
  to: '',
  subject: '',
  heading: '',
  message: '',
  buttonLabel: '',
  buttonUrl: '',
  note: '',
  signOff: COMPOSE_EMAIL_SIGN_OFF,
};
const DRAFT_KEY = 'slics.emailDraft';

const counter = (value, max) => `${value.length.toLocaleString('en-US')}/${max.toLocaleString('en-US')}`;

export default function ComposeEmail() {
  const router = useRouter();
  const [fields, setFields] = useState(EMPTY);
  const [copyMe, setCopyMe] = useState(true);
  const [scheme, setScheme] = useState('light');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');

  // The draft, from this browser only (it may be blocked or empty).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
      if (saved && typeof saved === 'object') setFields({ ...EMPTY, ...saved });
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const blank = Object.keys(EMPTY).every((key) => fields[key] === EMPTY[key]);
      if (blank) localStorage.removeItem(DRAFT_KEY);
      else localStorage.setItem(DRAFT_KEY, JSON.stringify(fields));
    } catch {}
  }, [fields]);

  const deferred = useDeferredValue(fields);
  const preview = useMemo(() => composedEmail(deferred, { origin: SITE_URL }).html, [deferred]);

  const set = (key) => (event) => {
    setFields((current) => ({ ...current, [key]: event.target.value }));
    setSentTo('');
  };

  const ask = (event) => {
    event.preventDefault();
    setError('');
    setSentTo('');
    const { value, error: invalid } = validateComposedEmail({ ...fields, copyMe });
    if (invalid) return setError(invalid);
    setConfirming(value);
  };

  const send = async () => {
    setBusy(true);
    const { error: sendError } = await apiRequest('/api/emails', { body: confirming });
    setBusy(false);
    if (sendError) {
      setConfirming(null);
      return setError(sendError);
    }
    tapHaptic();
    setSentTo(confirming.to);
    setConfirming(null);
    setFields({ ...EMPTY, signOff: fields.signOff });
    // The Sent list below picks it up.
    router.refresh();
  };

  const field = (key, props) => (
    <TextField
      sx={softInputSx}
      value={fields[key]}
      onChange={set(key)}
      disabled={busy}
      {...props}
      slotProps={{ ...props.slotProps, htmlInput: { maxLength: LIMITS[key], ...props.slotProps?.htmlInput } }}
    />
  );

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: 'minmax(0, 1fr)', lg: 'minmax(0, 1fr) minmax(0, 1fr)' },
        gap: { xs: 4, lg: 4 },
        alignItems: 'start',
      }}
    >
      <Box component='form' onSubmit={ask} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {field('to', {
          label: 'To',
          required: true,
          type: 'email',
          placeholder: 'name@example.com',
          helperText: `From ${COMPOSE_EMAIL_FROM_NAME} <${CONTACT_EMAIL}>. Replies come back to that inbox.`,
          slotProps: { htmlInput: { maxLength: 254, autoCapitalize: 'none', spellCheck: false, autoComplete: 'off' } },
        })}
        {field('subject', { label: 'Subject', required: true })}
        {field('heading', {
          label: 'Heading',
          placeholder: 'Optional',
          helperText: 'The big line at the top of the card.',
        })}
        {field('message', {
          label: 'Message',
          required: true,
          multiline: true,
          minRows: 8,
          placeholder: 'Hi Jane,\n\nA blank line starts a new paragraph. Web addresses become links.',
          helperText: counter(fields.message, LIMITS.message),
        })}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'minmax(0, 1fr)', sm: '2fr 3fr' }, gap: 2.5 }}>
          {field('buttonLabel', { label: 'Button words', placeholder: 'Optional' })}
          {field('buttonUrl', {
            label: 'Button link',
            placeholder: 'https://www.slics.app/…',
            slotProps: { htmlInput: { autoCapitalize: 'none', spellCheck: false, inputMode: 'url' } },
          })}
        </Box>
        {field('note', {
          label: 'Note',
          placeholder: 'Optional',
          multiline: true,
          minRows: 2,
          helperText: 'A smaller line in a pressed-in box, under the button.',
        })}
        {field('signOff', { label: 'Sign-off', multiline: true, minRows: 1 })}

        <Box component='label' sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: busy ? 'default' : 'pointer' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>Send me a copy</Typography>
            <Typography variant='body2' color='text.secondary'>
              A blind copy to {CONTACT_EMAIL}, since these don’t show up in Gmail’s Sent folder.
            </Typography>
          </Box>
          <Switch edge='end' checked={copyMe} disabled={busy} onChange={(event) => setCopyMe(event.target.checked)} />
        </Box>

        {error && <Alert severity='error'>{error}</Alert>}
        {sentTo && (
          <Alert severity='success' role='status'>
            Sent to {sentTo}.
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
      </Box>

      <Box component='section' aria-labelledby='email-preview' sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography id='email-preview' variant='h6' component='h3' sx={{ fontWeight: 700 }}>
            Preview
          </Typography>
          <Box role='group' aria-label='Preview in' sx={{ display: 'flex', gap: 1 }}>
            {[
              { key: 'light', label: 'Light', icon: <LightModeOutlined fontSize='small' /> },
              { key: 'dark', label: 'Dark', icon: <DarkModeOutlined fontSize='small' /> },
            ].map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                icon={option.icon}
                component='button'
                type='button'
                aria-pressed={scheme === option.key}
                onClick={() => setScheme(option.key)}
                clickable
                sx={[softToggleSx, { minHeight: '2.5rem', borderRadius: 999, px: 0.5 }]}
              />
            ))}
          </Box>
        </Box>
        <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
          <strong>{fields.subject.trim() || 'No subject yet'}</strong>
          <br />
          To {fields.to.trim() || '…'} · Dark is how Apple Mail shows it; Gmail and Outlook show the light one without
          the shadows.
        </Typography>
        <Box sx={[softInset, { borderRadius: 4, overflow: 'hidden', p: 0 }]}>
          {/* Sandboxed with nothing allowed: no scripts, and a link tapped here goes nowhere. */}
          <Box
            component='iframe'
            title='Email preview'
            sandbox=''
            srcDoc={preview}
            sx={{ display: 'block', width: '100%', height: { xs: '36rem', lg: '44rem' }, border: 0, colorScheme: scheme }}
          />
        </Box>
      </Box>

      <Dialog open={Boolean(confirming)} onClose={() => !busy && setConfirming(null)} fullWidth maxWidth='xs'>
        <DialogTitle>Send this email?</DialogTitle>
        <DialogContent>
          <Typography sx={{ overflowWrap: 'anywhere' }}>
            &ldquo;{confirming?.subject}&rdquo; goes to {confirming?.to} from {CONTACT_EMAIL}
            {confirming?.copyMe ? ', with a copy to you' : ''}. It can&apos;t be taken back.
          </Typography>
        </DialogContent>
        <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setConfirming(null)}
            disabled={busy}
            sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}
          >
            Cancel
          </Button>
          <Button
            variant='contained'
            onClick={send}
            disabled={busy}
            startIcon={busy ? <CircularProgress size={16} color='inherit' /> : <SendOutlined />}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
