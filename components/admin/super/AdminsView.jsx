'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from '@/components/utility/NextLink';
import dayjs from 'dayjs';
import {
  CheckOutlined,
  ExpandLess,
  ExpandMore,
  PersonAddAlt1Outlined,
  VerifiedUser,
} from '@mui/icons-material';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link as MuiLink,
  Stack,
  TextField,
  Typography,
  createFilterOptions,
} from '@mui/material';

import { ROLE_LABELS, STAFF_ROLES } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { areaEntries } from '@/lib/staffAreas';
import {
  softContainedSx,
  softInputSx,
  softInset,
  softPressSx,
  softRaised,
  softRaisedSmall,
  softToggleSx,
} from '@/components/utility/soft';
import RoleAreas from './RoleAreas';

const COUNT_LABELS = [
  ['slicEdits', 'SLIC change', 'SLIC changes'],
  ['coverJobs', 'cover job', 'cover jobs'],
  ['gyms', 'gym change', 'gym changes'],
  ['coverRefreshes', 'cover week', 'cover weeks'],
  ['adminActions', 'role or membership change', 'role or membership changes'],
];

const when = (at) => (at ? dayjs(at).format('MMM D, YYYY') : null);

function Section({ id, title, count, children }) {
  return (
    <Box component='section' aria-labelledby={id} sx={{ width: '100%' }}>
      <Typography id={id} variant='h6' component='h3' sx={{ mb: 1.5 }}>
        {title}
        {count !== undefined && (
          <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {' '}
            ({count})
          </Box>
        )}
      </Typography>
      {children}
    </Box>
  );
}

// One shared confirm dialog for adding, moving and removing
// (drivers/DeleteDriverDialog.jsx layout). `confirm` is { title, body, action,
// run } or null.
function ConfirmDialog({ confirm, onClose }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const close = () => {
    if (busy) return;
    setError('');
    onClose();
  };

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      await confirm.run();
      onClose();
      router.refresh();
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={Boolean(confirm)} onClose={close} fullWidth maxWidth='xs'>
      <DialogTitle>{confirm?.title}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Typography>{confirm?.body}</Typography>
        {error && <Alert severity='error'>{error}</Alert>}
      </DialogContent>
      <DialogActions disableSpacing sx={{ px: 3, pb: 3, gap: 1.5 }}>
        <Button onClick={close} sx={[softRaisedSmall, softPressSx, { px: 3, minHeight: '3rem' }]}>
          Cancel
        </Button>
        <Button
          variant='contained'
          color={confirm?.danger ? 'error' : 'primary'}
          onClick={run}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color='inherit' /> : null}
          sx={[softContainedSx, { px: 3, minHeight: '3rem' }]}
        >
          {confirm?.action}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// The other staff role: where "Make dispatch" / "Make admin" moves someone.
const otherRole = (role) => (role === 'admin' ? 'dispatch' : 'admin');

function AdminCard({ admin, isMe, index, onMove, onRemove }) {
  const [open, setOpen] = useState(false);
  const counts = COUNT_LABELS.filter(([key]) => admin.counts[key] > 0);
  const listId = `admin-activity-${admin._id}`;
  // Never a super admin, and never yourself (lib/db/admins.js refuses both).
  const changeable = !admin.superAdmin && !isMe;

  return (
    <Box
      component='li'
      className='enter'
      sx={(theme) => ({ ...softRaised(theme), '--i': index, borderRadius: 4, p: 2.5 })}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1.5, flexWrap: 'wrap' }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 700 }}>
            <MuiLink component={Link} href={`/admin/users/${admin._id}`}>
              {admin.name || admin.email}
            </MuiLink>
            {isMe && (
              <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
                {' '}
                (you)
              </Box>
            )}
          </Typography>
          <Typography variant='body2' color='text.secondary' sx={{ overflowWrap: 'anywhere' }}>
            {admin.email}
          </Typography>
        </Box>
        {admin.superAdmin && (
          <Chip
            icon={<VerifiedUser fontSize='small' />}
            label='Super admin'
            sx={[softRaisedSmall, { color: 'primary.main', fontWeight: 600, '& .MuiChip-icon': { color: 'primary.main' } }]}
          />
        )}
      </Box>

      <Typography variant='body2' sx={{ mt: 1.5 }}>
        {admin.lastActiveAt ? `Last activity ${when(admin.lastActiveAt)}` : 'No recorded activity'}
      </Typography>
      <Typography variant='body2' color='text.secondary'>
        {admin.lookups} lookup{admin.lookups === 1 ? '' : 's'}
        {admin.lastLookupAt && `, last ${when(admin.lastLookupAt)}`}
        {admin.joinedAt && ` · joined ${when(admin.joinedAt)}`}
      </Typography>

      {counts.length > 0 && (
        <Box component='ul' sx={{ listStyle: 'none', m: 0, mt: 1.5, p: 0, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {counts.map(([key, one, many]) => (
            <Box component='li' key={key}>
              <Chip
                size='small'
                label={`${admin.counts[key]} ${admin.counts[key] === 1 ? one : many}`}
                sx={softRaisedSmall}
              />
            </Box>
          ))}
        </Box>
      )}

      <Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
        {admin.recent.length > 0 && (
          <Button
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls={listId}
            endIcon={open ? <ExpandLess /> : <ExpandMore />}
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            Recent activity
          </Button>
        )}
        {changeable && (
          <Button
            onClick={() => onMove(admin)}
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            {otherRole(admin.role) === 'admin' ? 'Make admin' : 'Move to Dispatch'}
          </Button>
        )}
        {changeable && (
          <Button
            color='error'
            onClick={() => onRemove(admin)}
            sx={[softRaisedSmall, softPressSx, { px: 2.5, minHeight: '3rem' }]}
          >
            Remove
          </Button>
        )}
      </Box>

      {open && (
        <Box
          component='ol'
          id={listId}
          className='enter'
          sx={(theme) => ({
            ...softInset(theme),
            listStyle: 'none',
            m: 0,
            mt: 2,
            p: 2,
            borderRadius: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.25,
          })}
        >
          {admin.recent.map((item, i) => (
            <Box component='li' key={`${item.at}-${i}`} sx={{ typography: 'body2' }}>
              <Box component='span' sx={{ color: 'text.secondary' }}>
                {when(item.at)}
              </Box>{' '}
              · {item.text}
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}

function StaffList({ staff, myId, onMove, onRemove }) {
  return (
    <Stack component='ul' spacing={2} sx={{ listStyle: 'none', m: 0, p: 0 }}>
      {staff.map((admin, index) => (
        <AdminCard
          key={admin._id}
          admin={admin}
          index={index}
          isMe={admin._id === myId}
          onMove={onMove}
          onRemove={onRemove}
        />
      ))}
    </Stack>
  );
}

const filterOptions = createFilterOptions({
  stringify: (user) => `${user.name} ${user.email}`,
  limit: 50,
});

// "They'll have the tools turned on for Dispatch: SLICs and Jobs.", for the
// confirm dialogs.
function toolsSentence(role, roleAreas) {
  const labels = areaEntries(roleAreas[role]).map((area) => area.label);
  if (labels.length === 0) return `No tools are turned on for ${ROLE_LABELS[role]} yet.`;
  const list =
    labels.length === 1 ? labels[0] : `${labels.slice(0, -1).join(', ')} and ${labels.at(-1)}`;
  return `They'll have the tools turned on for ${ROLE_LABELS[role]}: ${list}.`;
}

// Where each role finds its tools, for the add dialog.
const FIND_THEM = {
  admin: 'They’ll find them under Admin in the menu, without Super Admin.',
  dispatch: 'They’ll find them under Dispatch in the menu.',
};

// The super admin's Admins page (docs/STAFF-ROLES.md): which tools each staff
// role may use, every admin and dispatcher with what the app recorded them
// doing, and adding, moving or removing one. Every change goes to
// `admin_audit`. `roleAreas` is { areas, changed } (getRoleAreasFresh).
export default function AdminsView({ admins, candidates, roleAreas: initialRoleAreas, myId }) {
  const [roleAreas, setRoleAreas] = useState(initialRoleAreas.areas);
  const [picked, setPicked] = useState(null);
  const [pickedRole, setPickedRole] = useState('admin');
  const [confirm, setConfirm] = useState(null);

  const adminRows = admins.filter((admin) => admin.role === 'admin');
  const dispatchRows = admins.filter((admin) => admin.role === 'dispatch');
  const nameOf = (user) => user.name || user.email;
  const becomes = (role) => (role === 'admin' ? 'an admin' : 'a dispatcher');

  const askAdd = () =>
    setConfirm({
      title: pickedRole === 'admin' ? 'Make an admin?' : 'Add to Dispatch?',
      body: `${nameOf(picked)} becomes ${becomes(pickedRole)}. ${toolsSentence(pickedRole, roleAreas)} ${FIND_THEM[pickedRole]}`,
      action: pickedRole === 'admin' ? 'Make admin' : 'Add to Dispatch',
      run: async () => {
        const { error } = await apiRequest('/api/admins', {
          body: { userId: picked._id, role: pickedRole },
        });
        if (error) throw new Error(error);
        setPicked(null);
      },
    });

  const askMove = (admin) => {
    const role = otherRole(admin.role);
    setConfirm({
      title: role === 'admin' ? 'Make an admin?' : 'Move to Dispatch?',
      body: `${nameOf(admin)} becomes ${becomes(role)}. ${toolsSentence(role, roleAreas)} What they did before stays on record.`,
      action: role === 'admin' ? 'Make admin' : 'Move to Dispatch',
      run: async () => {
        const { error } = await apiRequest(`/api/admins/${admin._id}`, {
          method: 'PATCH',
          body: { role },
        });
        if (error) throw new Error(error);
      },
    });
  };

  const askRemove = (admin) =>
    setConfirm({
      title: admin.role === 'admin' ? 'Remove this admin?' : 'Remove from Dispatch?',
      body: `${nameOf(admin)} goes back to a regular driver account. What they did stays on record.`,
      action: 'Remove',
      danger: true,
      run: async () => {
        const { error } = await apiRequest(`/api/admins/${admin._id}`, { method: 'DELETE' });
        if (error) throw new Error(error);
      },
    });

  return (
    <Stack spacing={4} sx={{ width: '100%' }}>
      <Section id='admins-roles' title='What each role can use'>
        <RoleAreas areas={roleAreas} onChange={setRoleAreas} />
      </Section>

      <Section id='admins-list' title='Admins' count={adminRows.length}>
        <StaffList staff={adminRows} myId={myId} onMove={askMove} onRemove={askRemove} />
      </Section>

      <Section id='admins-dispatch' title='Dispatch' count={dispatchRows.length}>
        {dispatchRows.length > 0 ? (
          <StaffList staff={dispatchRows} myId={myId} onMove={askMove} onRemove={askRemove} />
        ) : (
          <Typography variant='body2' color='text.secondary'>
            Nobody yet. Add someone below as Dispatch.
          </Typography>
        )}
      </Section>

      <Section id='admins-add' title='Add someone'>
        <Stack spacing={1.5}>
          <Autocomplete
            options={candidates}
            value={picked}
            onChange={(event, next) => setPicked(next)}
            getOptionLabel={(user) => user.name || user.email}
            getOptionKey={(user) => user._id}
            isOptionEqualToValue={(option, current) => option._id === current._id}
            filterOptions={filterOptions}
            renderOption={({ key, ...props }, user) => (
              <Box component='li' key={key} {...props}>
                <Box sx={{ minWidth: 0 }}>
                  <Box sx={{ fontWeight: 600 }}>{user.name || user.email}</Box>
                  {user.name && (
                    <Box sx={{ typography: 'body2', color: 'text.secondary', overflowWrap: 'anywhere' }}>
                      {user.email}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
            slotProps={{
              paper: {
                sx: [softRaised, { mt: 1, borderRadius: 4, '& .MuiAutocomplete-option': { minHeight: '3rem' } }],
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                placeholder='Search by name or email'
                slotProps={{ htmlInput: { ...params.inputProps, 'aria-label': 'User to add' } }}
                sx={softInputSx}
              />
            )}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            {/* Which role they get: pressed in, blue and checked while chosen. */}
            <Box role='group' aria-label='Role' sx={{ display: 'flex', gap: 1, flex: 1 }}>
              {STAFF_ROLES.map((role) => (
                <Button
                  key={role}
                  aria-pressed={pickedRole === role}
                  onClick={() => setPickedRole(role)}
                  startIcon={pickedRole === role ? <CheckOutlined /> : null}
                  sx={[
                    softToggleSx,
                    { px: 2.5, minHeight: '3rem', borderRadius: 999, color: 'text.primary' },
                  ]}
                >
                  {ROLE_LABELS[role]}
                </Button>
              ))}
            </Box>
            <Button
              variant='contained'
              onClick={askAdd}
              disabled={!picked}
              startIcon={<PersonAddAlt1Outlined />}
              // Right-aligned when a phone wraps it under the chips.
              sx={[softContainedSx, { px: 3, minHeight: '3rem', flexShrink: 0, ml: 'auto' }]}
            >
              Add
            </Button>
          </Box>
        </Stack>
      </Section>

      <Typography variant='body2' color='text.secondary'>
        Activity is what the app records with a name on it: SLIC changes (deletes from October 16,
        2026), cover jobs, gyms, cover-week refreshes, and (from October 10, 2026) role and
        membership changes. Deleted comments and driver-roster edits aren&apos;t recorded yet. A
        super admin can only be changed with <code>scripts/setSuperAdmin.mjs</code>.
      </Typography>

      <ConfirmDialog confirm={confirm} onClose={() => setConfirm(null)} />
    </Stack>
  );
}
