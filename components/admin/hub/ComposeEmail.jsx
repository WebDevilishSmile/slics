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
import { addressWithName, composedEmail, isEmailAddress, validateComposedEmail } from '@/lib/composedEmail';
import { validateAttachments } from '@/lib/emailAttachments';
import { tapHaptic } from '@/lib/haptics';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';

import EmailAttachments from './EmailAttachments';
import EmailRecipients, { groupOf } from './EmailRecipients';

// The compose form on /admin/super/email (POST /api/emails): who it's to
// (EmailRecipients.jsx: any number of people, picked from every account
// (`people`, from getEmailRecipients), typed, or a whole group; each gets
// their own copy), the
// subject, an optional heading, the message, an optional button and note, and
// the sign-off, with a live preview rendered by the same code the server
// sends (lib/composedEmail.js), and files to attach (EmailAttachments.jsx).
// The draft's words are kept in this browser until it's sent, so leaving the
// page doesn't lose them; its files aren't, since their uploads are cleaned
// up after a day.

const EMPTY = {
  // What's typed in "To" but not yet a chip.
  to: '',
  recipients: [],
  subject: '',
  heading: '',
  message: '',
  buttonLabel: '',
  buttonUrl: '',
  note: '',
  signOff: COMPOSE_EMAIL_SIGN_OFF,
};
const DRAFT_KEY = 'slics.emailDraft';

const attachedCount = (email) => (email?.attachments?.length ?? 0) + (email?.flyers?.length ?? 0);

const counter = (value, max) => `${value.length.toLocaleString('en-US')}/${max.toLocaleString('en-US')}`;

export default function ComposeEmail({ people = [] }) {
  const router = useRouter();
  const [fields, setFields] = useState(EMPTY);
  const [copyMe, setCopyMe] = useState(true);
  const [scheme, setScheme] = useState('light');
  const [confirming, setConfirming] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [files, setFiles] = useState([]);
  const uploading = files.some((file) => file.status === 'uploading');
  // The chips, plus a typed address not yet made one.
  const allRecipients = useMemo(() => {
    const typed = fields.to.trim().toLowerCase();
    return typed && isEmailAddress(typed) && !fields.recipients.includes(typed)
      ? [...fields.recipients, typed]
      : fields.recipients;
  }, [fields.to, fields.recipients]);
  // With one person, their account (for their name in the preview and the
  // confirm dialog; the server addresses the email with it).
  const recipient = useMemo(
    () => (allRecipients.length === 1 ? (people.find((person) => person.email === allRecipients[0]) ?? null) : null),
    [people, allRecipients],
  );

  // The draft, from this browser only (it may be blocked or empty).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) ?? 'null');
      if (saved && typeof saved === 'object') {
        setFields({
          ...EMPTY,
          ...saved,
          recipients: Array.isArray(saved.recipients) ? saved.recipients.filter((item) => typeof item === 'string') : [],
        });
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      const blank = Object.keys(EMPTY).every((key) =>
        Array.isArray(EMPTY[key]) ? !fields[key]?.length : fields[key] === EMPTY[key],
      );
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
    const { value, error: invalid } = validateComposedEmail({
      ...fields,
      recipients: allRecipients,
      group: groupOf(people, allRecipients),
      copyMe,
    });
    if (invalid) return setError(invalid);
    if (uploading) return setError('Wait for the files to finish uploading.');
    if (files.some((file) => file.status === 'failed')) {
      return setError('A file didn’t upload. Remove it, or attach it again.');
    }
    const { value: attachments, error: attachError } = validateAttachments(
      files.filter((file) => !file.flyer).map(({ url, name, size }) => ({ url, name, size })),
    );
    if (attachError) return setError(attachError);
    const flyers = files.filter((file) => file.flyer).map((file) => file.flyer);
    setConfirming({ ...value, attachments, flyers });
  };

  const send = async () => {
    setBusy(true);
    const { data, error: sendError } = await apiRequest('/api/emails', { body: confirming });
    setBusy(false);
    if (sendError) {
      setConfirming(null);
      return setError(sendError);
    }
    tapHaptic();
    const many = confirming.recipients.length > 1;
    const sent = data?.data?.sent ?? confirming.recipients.length;
    const notSent = data?.data?.failed ?? 0;
    setSentTo(
      many
        ? `Sent to ${sent} ${sent === 1 ? 'person' : 'people'}${notSent ? `. ${notSent} didn’t go out; try them again` : ''}.`
        : `Sent to ${confirming.to}.`,
    );
    setConfirming(null);
    setFields({ ...EMPTY, signOff: fields.signOff });
    setFiles([]);
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
        <EmailRecipients
          people={people}
          recipients={fields.recipients}
          setRecipients={(change) => {
            setFields((current) => ({
              ...current,
              recipients: typeof change === 'function' ? change(current.recipients) : change,
            }));
            setSentTo('');
          }}
          inputValue={fields.to}
          setInputValue={(value) => {
            setFields((current) => ({ ...current, to: value }));
            setSentTo('');
          }}
          disabled={busy}
        />
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

        <EmailAttachments
          files={files}
          setFiles={(change) => {
            setFiles(change);
            setSentTo('');
          }}
          disabled={busy}
          onProblem={setError}
        />

        <Box component='label' sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: busy ? 'default' : 'pointer' }}>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>Send me a copy</Typography>
            <Typography variant='body2' color='text.secondary'>
              A copy to {CONTACT_EMAIL}, since these don’t show up in Gmail’s Sent folder.
            </Typography>
          </Box>
          <Switch edge='end' checked={copyMe} disabled={busy} onChange={(event) => setCopyMe(event.target.checked)} />
        </Box>

        {error && <Alert severity='error'>{error}</Alert>}
        {sentTo && (
          <Alert severity={sentTo.includes('didn’t go out') ? 'warning' : 'success'} role='status'>
            {sentTo}
          </Alert>
        )}

        <Box>
          <Button
            type='submit'
            variant='contained'
            disabled={busy || uploading}
            startIcon={uploading ? <CircularProgress size={16} color='inherit' /> : <SendOutlined />}
            sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
          >
            {uploading ? 'Uploading files…' : 'Send'}
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
          To{' '}
          {allRecipients.length > 1
            ? `${allRecipients.length} people, one copy each`
            : allRecipients.length
              ? addressWithName(recipient?.name, allRecipients[0])
              : '…'}
          {files.length ? ` · Attached: ${files.map((file) => file.name).join(', ')}` : ''}{' '}
          · Dark is how Apple Mail shows it; Gmail and Outlook show the light one without
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
            &ldquo;{confirming?.subject}&rdquo; goes to{' '}
            {confirming?.recipients?.length > 1
              ? `${confirming.recipients.length} people, each their own copy,`
              : recipient?.name && recipient.email === confirming?.to
                ? `${recipient.name} (${confirming?.to})`
                : confirming?.to}{' '}
            from {CONTACT_EMAIL}
            {confirming?.copyMe ? ', with a copy to you' : ''}
            {attachedCount(confirming)
              ? `, with ${attachedCount(confirming) === 1 ? 'one file' : `${attachedCount(confirming)} files`} attached`
              : ''}
            . It can&apos;t be taken back.
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
