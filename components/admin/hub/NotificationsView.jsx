'use client';

import { useEffect, useRef, useState } from 'react';
import { CheckCircleOutline, DoneAll, NotificationsActiveOutlined, Undo, VerifiedUser } from '@mui/icons-material';
import { Alert, Box, Button, Chip, CircularProgress, Typography } from '@mui/material';

import { PUSH_TYPES } from '@/constants';
import { apiRequest } from '@/lib/apiRequest';
import { tapHaptic } from '@/lib/haptics';
import { softInset, softPressSx, softRaised, softRaisedSmall } from '@/components/utility/soft';
import ComposeNotification from './ComposeNotification';
import HubSection from './HubSection';
import PushLogList from './PushLogList';
import StatusLabel from './StatusLabel';
import { formatCount, formatDay, formatWhen, plural } from './format';

const SENT_FEEDBACK_MS = 2500;
const UNDO_MS = 10_000;
const TYPE_LABELS = Object.fromEntries(PUSH_TYPES.map((type) => [type.key, type.label]));

const visuallyHidden = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  overflow: 'hidden',
  clip: 'rect(0 0 0 0)',
  whiteSpace: 'nowrap',
  border: 0,
  padding: 0,
  margin: '-1px',
};

function Stat({ label, value, detail }) {
  return (
    <Box component='li' sx={[softRaised, { borderRadius: 4, p: 2 }]}>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography component='p' sx={{ typography: 'h5', fontWeight: 700 }}>
        {formatCount(value)}
      </Typography>
      {detail && (
        <Typography variant='body2' color='text.secondary'>
          {detail}
        </Typography>
      )}
    </Box>
  );
}

function AdminRow({ admin, isMe }) {
  const chosen = Object.entries(admin.prefs)
    .filter(([, on]) => on)
    .map(([key]) => TYPE_LABELS[key] ?? key);
  return (
    <Box component='li' sx={[softRaised, { borderRadius: 4, p: 2, display: 'flex', flexDirection: 'column', gap: 1 }]}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Typography sx={{ fontWeight: 700 }}>
          {admin.name}
          {isMe && (
            <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
              {' '}
              (you)
            </Box>
          )}
        </Typography>
        {admin.superAdmin && (
          <Chip
            size='small'
            icon={<VerifiedUser fontSize='small' />}
            label='Super admin'
            sx={[softRaisedSmall, { color: 'primary.main', '& .MuiChip-icon': { color: 'primary.main' } }]}
          />
        )}
      </Box>
      {admin.devices.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No device turned on.
        </Typography>
      ) : (
        <Box component='ul' sx={[softInset, { listStyle: 'none', m: 0, p: 1.5, borderRadius: 3, display: 'flex', flexDirection: 'column', gap: 0.75 }]}>
          {admin.devices.map((device, index) => (
            <Typography key={`${device.service}-${index}`} component='li' variant='body2'>
              <Box component='span' sx={{ fontWeight: 600 }}>
                {device.service}
              </Box>
              {device.since && ` · on since ${formatDay(device.since)}`}
              {` · ${device.lastSentAt ? `last delivered ${formatWhen(device.lastSentAt)}` : 'nothing delivered yet'}`}
            </Typography>
          ))}
        </Box>
      )}
      <Typography variant='body2' color='text.secondary'>
        {chosen.length ? `Gets: ${chosen.join(', ')}` : 'Gets: nothing (every kind is off)'}
      </Typography>
    </Box>
  );
}

// One kind of notification: who it reaches, how often it went out, and a
// sample to the super admin's own devices.
function KindRow({ kind, onSample, sampleState }) {
  return (
    <Box
      component='li'
      sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', py: 0.5 }}
    >
      <Box sx={{ flex: '1 1 14rem', minWidth: 0 }}>
        <Typography sx={{ fontWeight: 600 }}>
          {kind.label}
          <Box component='span' sx={{ color: 'text.secondary', fontWeight: 400 }}>
            {' '}
            · {kind.group}
            {kind.audience === 'superAdmin' ? ', super admins' : ''}
            {kind.audience === 'coverDriver' ? ', verified drivers' : ''}
          </Box>
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          On for {kind.on} of {plural(kind.eligible, kind.audience === 'coverDriver' ? 'verified driver' : 'admin')}
          {kind.on > 0 && ` (${kind.reachable} with a device)`} · {plural(kind.sentWeek, 'send')} this week
          {kind.lastAt ? ` · last ${formatWhen(kind.lastAt)}` : ' · never sent'}
        </Typography>
      </Box>
      <Button
        onClick={() => onSample(kind.key)}
        disabled={sampleState === 'sending'}
        startIcon={sampleState === 'sent' ? <CheckCircleOutline color='success' className='pop' /> : null}
        sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2, flexShrink: 0 }]}
      >
        {sampleState === 'sent' ? 'Sample sent' : 'Send me a sample'}
      </Button>
    </Box>
  );
}

// /admin/super/notifications (docs/SUPER-ADMIN-HUB.md stage C): everything
// about push notifications in one place, read-only except samples and a
// written message. Each admin chooses their own kinds on /profile.
export default function NotificationsView({ overview, log, myId }) {
  const [samples, setSamples] = useState({}); // key → 'sending' | 'sent'
  const [sampleError, setSampleError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const timers = useRef({});
  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const sendSample = async (key) => {
    setSampleError('');
    setSamples((current) => ({ ...current, [key]: 'sending' }));
    clearTimeout(timers.current[key]);
    const { data, error } = await apiRequest('/api/push/sample', { body: { type: key } });
    if (error || !data?.data?.sent) {
      setSamples((current) => ({ ...current, [key]: undefined }));
      setSampleError(
        error || 'No device took the sample. Turn notifications on on your profile first, on this device.',
      );
      return;
    }
    setSamples((current) => ({ ...current, [key]: 'sent' }));
    setAnnouncement(`Sample of ${TYPE_LABELS[key] ?? key} sent`);
    tapHaptic();
    timers.current[key] = setTimeout(
      () => setSamples((current) => ({ ...current, [key]: undefined })),
      SENT_FEEDBACK_MS,
    );
  };

  // The stats as the last clear or undo returned them, until the page's own
  // props change (a refresh after a written notification).
  const [stats, setStats] = useState(overview.stats);
  const [statsFrom, setStatsFrom] = useState(overview.stats);
  if (overview.stats !== statsFrom) {
    setStatsFrom(overview.stats);
    setStats(overview.stats);
  }
  const [clearing, setClearing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [clearError, setClearError] = useState('');

  // "Clear" (POST) and "Undo" (DELETE): lib/db/pushLog.js. Confirmed in
  // place: the status turns to "Sending normally" and the button to "Undo"
  // for UNDO_MS.
  const changeClear = async (undo) => {
    setClearing(true);
    setClearError('');
    clearTimeout(timers.current.undo);
    const { data, error } = await apiRequest('/api/push-log/clear', { method: undo ? 'DELETE' : 'POST' });
    setClearing(false);
    if (error) {
      setCanUndo(false);
      return setClearError(error);
    }
    setStats(data.data);
    setCanUndo(!undo);
    setAnnouncement(undo ? 'Clear undone' : 'Failures cleared');
    tapHaptic();
    if (!undo) timers.current.undo = setTimeout(() => setCanUndo(false), UNDO_MS);
  };

  const adminsOn = overview.admins.filter((admin) => admin.devices.length > 0).length;
  const devices = overview.admins.reduce((sum, admin) => sum + admin.devices.length, 0);
  const failing = stats.open.failed > 0;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
      <HubSection id='push-overview' title='Overview'>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <StatusLabel
              status={overview.configured ? (failing ? 'warning' : 'ok') : 'error'}
              word={
                overview.configured
                  ? failing
                    ? `${stats.open.failed} failed ${stats.cleared ? 'since cleared' : 'this week'}`
                    : 'Sending normally'
                  : 'Push keys not set: nothing can be sent'
              }
            />
            {(failing || canUndo) && (
              <Button
                onClick={() => changeClear(canUndo)}
                disabled={clearing}
                startIcon={
                  clearing ? (
                    <CircularProgress size={16} color='inherit' />
                  ) : canUndo ? (
                    <Undo className='pop' />
                  ) : (
                    <DoneAll />
                  )
                }
                sx={[softRaisedSmall, softPressSx, { minHeight: '2.75rem', px: 2 }]}
              >
                {canUndo ? 'Undo' : 'Clear failures'}
              </Button>
            )}
          </Box>
          {(stats.lastFailure && !stats.lastFailure.cleared) || stats.cleared ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              {stats.lastFailure && !stats.lastFailure.cleared && (
                <Typography variant='body2' color='text.secondary'>
                  Last failure {formatWhen(stats.lastFailure.at)}: &ldquo;{stats.lastFailure.title}&rdquo;
                </Typography>
              )}
              {stats.cleared && (
                <Typography variant='body2' color='text.secondary'>
                  Failures cleared {formatWhen(stats.cleared.at)}
                  {stats.cleared.by ? ` by ${stats.cleared.by.name}` : ''}. Earlier ones stay in Recent sends.
                </Typography>
              )}
            </Box>
          ) : null}
          {clearError && <Alert severity='error'>{clearError}</Alert>}
          <Box
            component='ul'
            sx={{
              listStyle: 'none',
              m: 0,
              p: 0,
              display: 'grid',
              gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' },
              gap: { xs: 1.5, sm: 2 },
            }}
          >
            <Stat
              label='Admins with a device'
              value={adminsOn}
              detail={`of ${plural(overview.admins.length, 'admin')}, ${plural(devices, 'device')}`}
            />
            {/* Counts only: who they are stays private (docs/PUSH-NOTIFICATIONS.md, stage 2). */}
            <Stat
              label='Drivers with a device'
              value={overview.drivers.accounts}
              detail={plural(overview.drivers.devices, 'device')}
            />
            <Stat label='Sends today' value={stats.day.sends} detail={`${formatCount(stats.day.sent)} delivered`} />
            <Stat label='Sends this week' value={stats.week.sends} detail={`${formatCount(stats.week.sent)} delivered, ${formatCount(stats.week.errored)} failed${stats.week.gone ? `, ${formatCount(stats.week.gone)} gone` : ''}`} />
          </Box>
        </Box>
      </HubSection>

      <HubSection
        id='push-admins'
        title='Admins and devices'
        description='Each admin turns devices on and picks their kinds on their own profile. One device per browser.'
      >
        <Box
          component='ul'
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          {overview.admins.map((admin) => (
            <AdminRow key={admin._id} admin={admin} isMe={admin._id === myId} />
          ))}
        </Box>
      </HubSection>

      <HubSection
        id='push-kinds'
        title='Kinds'
        description='A sample goes to your own devices with made-up details, whatever kinds you chose.'
      >
        {sampleError && (
          <Alert severity='error' sx={{ mb: 2 }}>
            {sampleError}
          </Alert>
        )}
        <Box
          component='ul'
          sx={[
            softInset,
            { listStyle: 'none', m: 0, p: { xs: 1.5, sm: 2 }, borderRadius: 4, display: 'flex', flexDirection: 'column', gap: 1 },
          ]}
        >
          {overview.kinds.map((kind) => (
            <KindRow key={kind.key} kind={kind} onSample={sendSample} sampleState={samples[kind.key]} />
          ))}
        </Box>
      </HubSection>

      <HubSection
        id='push-compose'
        title='Write a notification'
        description='For something the kinds don’t cover. Recorded in the admin audit.'
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main' }}>
          <NotificationsActiveOutlined fontSize='small' />
          <Typography variant='body2' color='text.secondary'>
            {plural(adminsOn, 'admin')} can get it right now.
          </Typography>
        </Box>
        <ComposeNotification admins={overview.admins} myId={myId} />
      </HubSection>

      <HubSection id='push-log' title='Recent sends' description='Kept 90 days. “Delivered” means the push service took it.'>
        {/* Keyed on the newest row, so a refresh after a send starts it over. */}
        <PushLogList key={log.rows[0]?._id ?? 'empty'} initial={log} clearedAt={stats.cleared?.at ?? null} />
      </HubSection>

      <Box component='span' role='status' aria-live='polite' sx={visuallyHidden}>
        {announcement}
      </Box>
    </Box>
  );
}
