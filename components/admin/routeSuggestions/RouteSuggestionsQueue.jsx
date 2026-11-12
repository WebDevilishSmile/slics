'use client';

import { useState } from 'react';
import Link from '@/components/utility/NextLink';
import dayjs from 'dayjs';
import { CheckCircleOutline, DeleteOutline, DoneAll, EditOutlined } from '@mui/icons-material';
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
import { setOpenRouteSuggestionsCount } from '@/lib/routeSuggestionsStore';
import { ROUTE_NOTE_MAX_LENGTH, ROUTE_TEXT_MAX_LENGTH, mentionsCode, parseRoute } from '@/lib/routeText';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';

const when = (iso) => (iso ? dayjs(iso).format('MMM D, YYYY h:mm A') : '');
const STATUS_LABELS = { approved: 'Approved', declined: 'Declined' };
const slicName = (item) => (item.slicLabel ? `${item.slicLabel} (${item.numSlic})` : `SLIC ${item.numSlic}`);
const stepCount = (text) => parseRoute(text).reduce((sum, section) => sum + section.steps.length, 0);

// Plain text in a well, line breaks kept: a route or a note, never HTML.
function TextWell({ children, sx }) {
  return (
    <Typography
      component='div'
      sx={[
        softInset,
        { borderRadius: 3, p: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', typography: 'body2' },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {children}
    </Typography>
  );
}

function OpenSuggestion({ item, index, busy, onApprove, onDecline, onDelete }) {
  const [text, setText] = useState(item.text);
  const [answer, setAnswer] = useState('');
  const [declining, setDeclining] = useState(false);
  const steps = stepCount(text);

  return (
    <Box
      component='li'
      className='enter'
      sx={[softRaised, { '--i': index, borderRadius: 4, p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }]}
    >
      <Box>
        <Typography variant='h6' component='h3'>
          {slicName(item)}
        </Typography>
        <Typography variant='caption' color='text.secondary'>
          {item.suggestedBy ?? 'A deleted account'} · {when(item.updated_at ?? item.created_at)}
          {item.currentText ? ' · a change to the route' : ' · no route yet'}
        </Typography>
      </Box>

      {item.note && (
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 0.75 }}>
            Driver&apos;s note
          </Typography>
          <TextWell>{item.note}</TextWell>
        </Box>
      )}

      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 0.75 }}>
            Now
          </Typography>
          {item.currentText ? (
            <TextWell sx={{ maxHeight: '22rem', overflowY: 'auto' }}>{item.currentText}</TextWell>
          ) : (
            <Typography variant='body2' color='text.secondary'>
              This SLIC has no route yet.
            </Typography>
          )}
        </Box>
        <Box>
          <Typography variant='subtitle2' sx={{ mb: 0.75 }}>
            Suggested (edit before approving if needed)
          </Typography>
          <TextField
            value={text}
            onChange={(event) => setText(event.target.value)}
            multiline
            minRows={6}
            maxRows={16}
            fullWidth
            disabled={busy}
            helperText={`${steps} step${steps === 1 ? '' : 's'} · ${text.length}/${ROUTE_TEXT_MAX_LENGTH}`}
            slotProps={{ htmlInput: { maxLength: ROUTE_TEXT_MAX_LENGTH, 'aria-label': `Suggested route for ${slicName(item)}` } }}
            sx={softInputSx}
          />
        </Box>
      </Box>

      {mentionsCode(text) && (
        <Alert severity='warning'>
          This looks like it has a gate code. Every signed-in driver can read the route, so take it
          out before approving.
        </Alert>
      )}

      {declining && (
        <TextField
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          multiline
          minRows={2}
          placeholder="Optional: why, so the driver knows (they'll see this)"
          disabled={busy}
          slotProps={{ htmlInput: { maxLength: ROUTE_NOTE_MAX_LENGTH, 'aria-label': 'Answer to the driver' } }}
          sx={softInputSx}
        />
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button
          onClick={() => onDelete(item)}
          disabled={busy}
          startIcon={<DeleteOutline />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem', mr: 'auto', color: 'error.main' }]}
        >
          Delete
        </Button>
        <Button
          component={Link}
          href={`/admin/edit/${encodeURIComponent(item.numSlic)}`}
          startIcon={<EditOutlined />}
          sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
        >
          Edit page
        </Button>
        {declining ? (
          <>
            <Button
              onClick={() => setDeclining(false)}
              disabled={busy}
              sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
            >
              Cancel
            </Button>
            <Button
              onClick={() => onDecline(item, answer)}
              disabled={busy}
              sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
            >
              Decline
            </Button>
          </>
        ) : (
          <Button
            onClick={() => setDeclining(true)}
            disabled={busy}
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            Decline…
          </Button>
        )}
        <Button
          variant='contained'
          onClick={() => onApprove(item, text)}
          disabled={busy || !steps || declining}
          startIcon={<DoneAll />}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Approve and publish
        </Button>
      </Box>
    </Box>
  );
}

// Delete, for test suggestions; a real one is approved or declined.
function DeleteDialog({ item, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setError('');
    const { error } = await apiRequest(`/api/route-suggestions/${item._id}`, { method: 'DELETE' });
    setDeleting(false);
    if (error && error !== 'That suggestion is already gone.') return setError(error);
    onDeleted(item._id);
  };

  return (
    <Dialog open onClose={deleting ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Delete this suggestion?</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>
          The suggestion for {slicName(item)} goes for good. A real one is approved or declined
          instead, so the driver hears back.
        </Typography>
        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} disabled={deleting} sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color='error'
          onClick={handleDelete}
          disabled={deleting}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// The queue on /admin/routes (docs/SLIC-DIRECTIONS.md, stage 2): open
// suggestions oldest first, each beside the route it would replace, then the
// last few decided. Approving publishes the text as edited here; declining
// sends the driver the answer.
export default function RouteSuggestionsQueue({ initialOpen, initialClosed }) {
  const [open, setOpen] = useState(initialOpen);
  const [closed, setClosed] = useState(initialClosed);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [deleting, setDeleting] = useState(null);

  const settle = (id, decided) => {
    const nextOpen = open.filter((item) => item._id !== id);
    setOpen(nextOpen);
    if (decided) setClosed([decided, ...closed]);
    else setClosed(closed.filter((item) => item._id !== id));
    setOpenRouteSuggestionsCount(nextOpen.length);
  };

  const decide = async (item, body, message) => {
    setBusyId(item._id);
    setError('');
    setDone('');
    const { data, error } = await apiRequest(`/api/route-suggestions/${item._id}`, { method: 'PATCH', body });
    setBusyId(null);
    if (error) return setError(error);
    settle(item._id, data.data);
    setDone(message);
  };

  return (
    <Paper variant='panel' sx={{ minHeight: 0, alignItems: 'stretch', gap: 3, px: 2 }}>
      <Box role='status' aria-live='polite'>
        {done && <Alert severity='success'>{done}</Alert>}
      </Box>
      {error && <Alert severity='error'>{error}</Alert>}

      {open.length === 0 ? (
        <Box className='enter' sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 3 }}>
          <CheckCircleOutline color='primary' sx={{ fontSize: '2.5rem' }} />
          <Typography>No open suggestions.</Typography>
        </Box>
      ) : (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5 }}>
          {open.map((item, index) => (
            <OpenSuggestion
              key={item._id}
              item={item}
              index={index}
              busy={busyId === item._id}
              onApprove={(suggestion, text) =>
                decide(suggestion, { action: 'approve', text }, `${slicName(suggestion)}: route published.`)
              }
              onDecline={(suggestion, answer) =>
                decide(suggestion, { action: 'decline', answer }, `${slicName(suggestion)}: declined.`)
              }
              onDelete={setDeleting}
            />
          ))}
        </Box>
      )}

      {closed.length > 0 && (
        <Box component='section' aria-labelledby='decided-suggestions'>
          <Typography id='decided-suggestions' variant='subtitle1' component='h2' sx={{ mb: 1.5 }}>
            Recently decided
          </Typography>
          <Box
            component='ul'
            sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 4, display: 'grid', gap: 1 }]}
          >
            {closed.map((item) => (
              <Box component='li' key={item._id} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant='body2'>
                    <strong>{slicName(item)}</strong> · {item.suggestedBy ?? 'A deleted account'}
                  </Typography>
                  <Typography variant='caption' color='text.secondary'>
                    {STATUS_LABELS[item.status] ?? item.status}
                    {item.decidedBy ? ` by ${item.decidedBy}` : ''} · {when(item.decidedAt)}
                    {item.answer ? ` · “${item.answer}”` : ''}
                  </Typography>
                </Box>
                <Button
                  size='small'
                  onClick={() => setDeleting(item)}
                  aria-label={`Delete the suggestion for ${slicName(item)}`}
                  sx={[softPressSx, { minWidth: '2.75rem', minHeight: '2.75rem', color: 'error.main', flexShrink: 0 }]}
                >
                  <DeleteOutline />
                </Button>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {deleting && (
        <DeleteDialog
          item={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={(id) => {
            settle(id, null);
            setDeleting(null);
          }}
        />
      )}
    </Paper>
  );
}
