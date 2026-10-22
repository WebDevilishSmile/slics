'use client';

import { useId, useState } from 'react';
import dayjs from 'dayjs';
import { useSession } from 'next-auth/react';
import {
  CheckCircleOutline,
  ErrorOutline,
  HelpOutline,
  VerifiedOutlined,
} from '@mui/icons-material';
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
import { setPendingClaimsCount } from '@/lib/driverClaimsStore';
import { driverNameKey, rankSheetNames } from '@/lib/driverNames';
import { displayName } from '@/lib/names';
import { DRIVER_CLAIM_NOTE_MAX_LENGTH } from '@/constants';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
} from '@/components/utility/soft';
import SheetNameField from './SheetNameField';

const day = (value) => (value ? dayjs(value).format('MMM D, YYYY') : '');
const when = (iso) => (iso ? dayjs(iso).format('MMM D, YYYY h:mm A') : '');
const softButtonSx = [softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }];

// One line of the evidence well: a label, then the value.
function Evidence({ label, children }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
      <Typography variant='body2' color='text.secondary' sx={{ flexShrink: 0 }}>
        {label}
      </Typography>
      <Typography variant='body2' sx={{ textAlign: 'right', overflowWrap: 'anywhere' }}>
        {children}
      </Typography>
    </Box>
  );
}

// What the roster (`drivers`) says about the claimed employee ID, and where
// that roster row is on the sheet (`sheet`, from the merge on /admin/drivers).
// A hint only: drivers come from the sheets, and the roster isn't kept for
// everyone.
function RosterHint({ roster, sheet }) {
  if (!roster) {
    return (
      <Box sx={{ display: 'flex', gap: 1, color: 'text.secondary' }}>
        <HelpOutline fontSize='small' />
        <Typography variant='body2'>No roster row has this employee ID.</Typography>
      </Box>
    );
  }
  const Icon = roster.seniorityMatches ? CheckCircleOutline : ErrorOutline;
  return (
    <Box sx={{ display: 'flex', gap: 1 }}>
      <Icon
        fontSize='small'
        sx={{ color: roster.seniorityMatches ? 'primary.main' : 'warning.main', mt: 0.25 }}
      />
      <Typography variant='body2'>
        Roster: <strong>{displayName(roster.name) || 'no name'}</strong>, seniority {day(roster.seniorityDate)}
        {roster.seniorityMatches ? ' (matches)' : ' (differs)'}
        {sheet && `; on the sheet as ${displayName(sheet.name)}${sheet.rank ? ` (#${sheet.rank})` : ''}`}
      </Typography>
    </Box>
  );
}

function PendingClaim({ claim, index, names, onSheet, mine, busy, onApprove, onReject }) {
  const account = claim.account;
  const sheet = claim.roster ? (onSheet[claim.roster._id] ?? null) : null;
  // Preselect where their employee ID's roster row is on the sheet, or else
  // the sheet name most like the one they typed, if it's free.
  const [sheetName, setSheetName] = useState(() => {
    const free = names.filter((entry) => !entry.linkedTo || entry.linkedTo._id === account?._id);
    const freeNames = free.map((entry) => entry.name);
    if (sheet && freeNames.some((name) => driverNameKey(name) === driverNameKey(sheet.name))) {
      return sheet.name;
    }
    return rankSheetNames(claim.name, freeNames)[0] ?? '';
  });
  const taken = names.find(
    (entry) =>
      driverNameKey(entry.name) === driverNameKey(sheetName) &&
      entry.linkedTo &&
      entry.linkedTo._id !== account?._id,
  );

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
          {displayName(claim.name)}
        </Typography>
        <Typography variant='caption' color='text.secondary' component='p'>
          Account: {account ? `${account.name || 'No name'} · ${account.email}` : 'deleted'}
          {account?.joinedAt && ` · joined ${day(account.joinedAt)}`}
        </Typography>
        <Typography variant='caption' color='text.secondary' component='p'>
          Sent {when(claim.updated_at ?? claim.created_at)}
        </Typography>
      </Box>

      <Box sx={[softInset, { borderRadius: 3, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }]}>
        <Evidence label='UPS email'>{claim.employeeEmail}</Evidence>
        <Evidence label='Seniority date'>{day(claim.seniorityDate)}</Evidence>
        <RosterHint roster={claim.roster} sheet={sheet} />
      </Box>

      <SheetNameField
        names={names}
        value={sheetName}
        onChange={setSheetName}
        claimedName={claim.name}
        userId={account?._id}
        disabled={busy || mine}
      />

      {mine && (
        <Typography variant='body2' color='text.secondary'>
          This is your own claim. Another admin decides it.
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 1.5 }}>
        <Button onClick={() => onReject(claim)} disabled={busy || mine} sx={softButtonSx}>
          Turn down
        </Button>
        <Button
          variant='contained'
          startIcon={<VerifiedOutlined />}
          onClick={() => onApprove(claim, sheetName)}
          disabled={busy || mine || !account || !sheetName.trim() || Boolean(taken)}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Verify
        </Button>
      </Box>
    </Box>
  );
}

// The reason for turning a claim down, which the driver sees on /covers.
// Mounted only while open.
function RejectDialog({ claim, busy, error, onClose, onConfirm }) {
  const formId = useId();
  const [note, setNote] = useState('');

  return (
    <Dialog open onClose={busy ? undefined : onClose} fullWidth maxWidth='xs'>
      <DialogTitle>Turn down {claim.name}?</DialogTitle>
      <DialogContent>
        <Box
          component='form'
          id={formId}
          onSubmit={(event) => {
            event.preventDefault();
            onConfirm(claim, note);
          }}
          sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}
        >
          <Typography variant='body2' color='text.secondary'>
            They see the reason on the Covers page and can send a new claim.
            Their employee ID and seniority date are deleted.
          </Typography>
          <TextField
            sx={softInputSx}
            label='Reason (optional)'
            multiline
            minRows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Your name isn't on the sheet. Use it as the sheet spells it."
            helperText={`${note.length}/${DRIVER_CLAIM_NOTE_MAX_LENGTH}`}
            disabled={busy}
            slotProps={{ htmlInput: { maxLength: DRIVER_CLAIM_NOTE_MAX_LENGTH } }}
          />
          {error && <Alert severity='error'>{error}</Alert>}
        </Box>
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={onClose} disabled={busy} sx={softButtonSx}>
          Cancel
        </Button>
        <Button
          type='submit'
          form={formId}
          variant='contained'
          disabled={busy}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          Turn down
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// The admin queue of driver claims (docs/COVER-BIDDING.md): pending claims,
// oldest first, then the last few decided. Verify links the account to the
// driver's name as the sheet spells it; Turn down sends the driver a reason.
// `names` is getClaimableDriverNames; `onSheet` maps a roster row's id to
// `{ name, rank }`, its driver on the sheet (lib/driverRoster.js).
export default function DriverClaimsQueue({
  initialPending,
  initialDecided,
  names: initialNames,
  onSheet,
}) {
  const { data: session } = useSession();
  const [pending, setPending] = useState(initialPending);
  const [decided, setDecided] = useState(initialDecided);
  const [names, setNames] = useState(initialNames);
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [error, setError] = useState('');

  // Nobody decides their own claim but the super admin (lib/db/driverClaims.js).
  const isMine = (claim) =>
    claim.account?._id === session?.user?.id && session?.user?.superAdmin !== true;

  const decide = async (claim, body) => {
    setBusyId(claim._id);
    setError('');
    const { data, error } = await apiRequest(`/api/driver-claims/${claim._id}`, {
      method: 'PATCH',
      body,
    });
    setBusyId(null);
    if (error) return setError(error);

    const updated = data.data;
    const nextPending = pending.filter((item) => item._id !== claim._id);
    setPending(nextPending);
    setDecided([updated, ...decided]);
    setPendingClaimsCount(nextPending.length);
    setRejecting(null);
    // The name is taken now: no other claim can be linked to it.
    if (updated.status === 'approved' && claim.account) {
      const key = driverNameKey(updated.linkedName);
      const holder = { _id: claim.account._id, name: claim.account.name };
      setNames((current) =>
        current.some((entry) => driverNameKey(entry.name) === key)
          ? current.map((entry) =>
              driverNameKey(entry.name) === key ? { ...entry, linkedTo: holder } : entry,
            )
          : [...current, { name: updated.linkedName, sources: [], linkedTo: holder }],
      );
    }
  };

  return (
    <Paper variant='panel' sx={{ minHeight: 0, alignItems: 'stretch', gap: 3, px: 2 }}>
      {error && !rejecting && <Alert severity='error'>{error}</Alert>}

      {pending.length === 0 ? (
        <Box
          className='enter'
          sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, py: 3 }}
        >
          <CheckCircleOutline color='primary' sx={{ fontSize: '2.5rem' }} />
          <Typography>No claims waiting.</Typography>
        </Box>
      ) : (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, p: 0, display: 'grid', gap: 2.5 }}>
          {pending.map((claim, index) => (
            <PendingClaim
              key={claim._id}
              claim={claim}
              index={index}
              names={names}
              onSheet={onSheet}
              mine={isMine(claim)}
              busy={busyId === claim._id}
              onApprove={(item, name) => decide(item, { status: 'approved', name })}
              onReject={setRejecting}
            />
          ))}
        </Box>
      )}

      {decided.length > 0 && (
        <Box component='section' aria-labelledby='decided-claims'>
          <Typography id='decided-claims' variant='subtitle1' component='h2' sx={{ mb: 1.5 }}>
            Recently decided
          </Typography>
          <Box
            component='ul'
            sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 4, display: 'grid', gap: 1 }]}
          >
            {decided.map((claim) => (
              <Box component='li' key={claim._id} sx={{ p: 1 }}>
                <Typography variant='body2'>
                  <strong>{claim.account?.name || claim.name}</strong>
                  {claim.status === 'approved'
                    ? ` · verified as ${claim.linkedName}`
                    : ' · turned down'}
                </Typography>
                {claim.status === 'rejected' && claim.note && (
                  // Plain text, never HTML.
                  <Typography variant='body2' color='text.secondary' sx={{ whiteSpace: 'pre-wrap' }}>
                    {claim.note}
                  </Typography>
                )}
                <Typography variant='caption' color='text.secondary'>
                  {claim.decidedBy ? `By ${claim.decidedBy} · ` : ''}
                  {when(claim.decided_at)}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      {rejecting && (
        <RejectDialog
          claim={rejecting}
          busy={busyId === rejecting._id}
          error={error}
          onClose={() => {
            setRejecting(null);
            setError('');
          }}
          onConfirm={(claim, note) => decide(claim, { status: 'rejected', note })}
        />
      )}
    </Paper>
  );
}
