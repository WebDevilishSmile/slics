'use client';

import dayjs from 'dayjs';
import Link from 'next/link';
import { useState } from 'react';

import { capitalizeFirstLetter } from '@/lib/format';

import {
  BadgeOutlined,
  EmailOutlined,
  EventOutlined,
  LocalCafeOutlined,
  PhoneOutlined,
  SettingsOutlined,
  VerifiedOutlined,
  VolunteerActivismOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  IconButton,
  Link as MuiLink,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';

import BmcButton from '@/components/layout/BmcButton';
import SoftNotice from '@/components/utility/SoftNotice';
import VerifiedBadge from '@/components/utility/VerifiedBadge';
import { softInset, softPressSx } from '@/components/utility/soft';
import EditProfileDialog from './EditProfileDialog';
import ProfileImage from './ProfileImage';
import PushNotifications from './PushNotifications';

// One line of the details well: a brand-blue icon, a quiet label, the value.
function Detail({ icon, label, children }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ color: 'primary.main', display: 'flex', flexShrink: 0, pt: 0.25 }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant='body2' color='text.secondary'>
          {label}
        </Typography>
        <Typography sx={{ overflowWrap: 'anywhere' }}>{children}</Typography>
      </Box>
    </Box>
  );
}

// The profile card in the soft style (CLAUDE.md "Visual style"): a seamless
// panel with the avatar on a raised ring, the name, the details in a
// pressed-in well, and, for a non-member, a soft notice with the Buy Me a
// Coffee button. The gear opens EditProfileDialog (name, phone, password,
// delete). `userData.hasPassword` comes from the page, never the hash.
// `supporterSince`: when they first supported the app on Buy Me a Coffee (an
// ISO string, or null). Only they see this page, so it needs no opt-in.
// `pushPrefs`: an admin's notification kinds (`{ key: boolean }`), or null.
// `canUseCovers`: whether this account has Covers (lib/authz.js), from the page.
function ProfileData({
  userData,
  commentCount,
  supporterSince = null,
  pushPrefs = null,
  canUseCovers = false,
}) {
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('Random error occurred');
  const [snackSeverity, setSnackSeverity] = useState('error');
  const [editProfileOpen, setEditProfileOpen] = useState(false);

  const handleCloseSnack = () => {
    setOpenSnack(false);
    setSnackMessage('');
    setSnackSeverity('error');
  };
  const showSnackbar = (message, severity = 'error') => {
    setSnackMessage(message);
    setSnackSeverity(severity);
    setOpenSnack(true);
  };

  if (!userData) {
    return (
      <Box sx={{ textAlign: 'center', marginTop: 2 }}>
        <Typography variant='h6'>User data not found.</Typography>
      </Box>
    );
  }

  return (
    <Paper
      variant='panel'
      className='enter'
      sx={{
        mt: 3,
        minHeight: 0,
        px: { xs: 2, sm: 3 },
        py: 3,
        gap: 2.5,
        position: 'relative',
      }}
    >
      <Tooltip title='Edit profile'>
        <IconButton
          onClick={() => setEditProfileOpen(true)}
          aria-label='Edit profile'
          sx={[
            softPressSx,
            { position: 'absolute', top: '0.75rem', right: '0.75rem', width: '3rem', height: '3rem' },
          ]}
        >
          <SettingsOutlined />
        </IconButton>
      </Tooltip>

      <ProfileImage userData={userData} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant='h5' component='p' sx={{ fontWeight: 700 }}>
          {userData.name}
          {userData.driverVerified && <VerifiedBadge />}
        </Typography>
        <Typography variant='body2' color='text.secondary'>
          {commentCount} tip{commentCount === 1 ? '' : 's'} shared
        </Typography>
      </Box>

      <Box
        sx={[
          softInset,
          {
            alignSelf: 'stretch',
            borderRadius: 4,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        ]}
      >
        <Detail icon={<EmailOutlined />} label='Email'>
          {userData.email}
        </Detail>
        <Detail icon={<PhoneOutlined />} label='Phone'>
          {userData.phone || 'Not provided'}
        </Detail>
        <Detail icon={<BadgeOutlined />} label='Role'>
          {capitalizeFirstLetter(userData.role)}
        </Detail>
        {/* Verification is only offered where Covers is (admins while it's
            tested, docs/COVER-BIDDING.md). */}
        {(userData.driverVerified || canUseCovers) && (
          <Detail icon={<VerifiedOutlined />} label='Driver'>
            {userData.driverVerified ? (
              `Verified · ${userData.driverName}`
            ) : (
              <>
                Not verified ·{' '}
                <MuiLink component={Link} href='/covers'>
                  Verify on Covers
                </MuiLink>
              </>
            )}
          </Detail>
        )}
        <Detail icon={<LocalCafeOutlined />} label='Membership'>
          {userData.bmcMember ? 'Active' : 'Inactive'}
        </Detail>
        {supporterSince && (
          <Detail icon={<VolunteerActivismOutlined />} label='Supporter since'>
            {dayjs(supporterSince).format('MMMM YYYY')}
          </Detail>
        )}
        <Detail icon={<EventOutlined />} label='Joined'>
          {dayjs(userData.created_at).format('MMM D, YYYY')}
        </Detail>
      </Box>

      {/* Admins only until stage 2 (docs/PUSH-NOTIFICATIONS.md); the
          subscription routes check it too. */}
      {userData.role === 'admin' && <PushNotifications prefs={pushPrefs} />}

      {!userData.bmcMember && (
        <SoftNotice
          icon={<LocalCafeOutlined />}
          actions={<BmcButton sx={{ ml: 1 }} />}
        >
          Become a member to keep your SLIC history and support the app.
        </SoftNotice>
      )}

      <EditProfileDialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        userData={userData}
        commentCount={commentCount}
        showSnackbar={showSnackbar}
      />

      <Snackbar open={openSnack} onClose={handleCloseSnack}>
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default ProfileData;
