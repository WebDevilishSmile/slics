'use client';

import dayjs from 'dayjs';
import { useState } from 'react';

import { capitalizeFirstLetter } from '@/utils/functions';

import {
  BadgeOutlined,
  EmailOutlined,
  EventOutlined,
  LocalCafeOutlined,
  PhoneOutlined,
  SettingsOutlined,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  IconButton,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material';

import BmcButton from '../layout/BmcButton';
import SoftNotice from '../utility/SoftNotice';
import { softInset, softPressSx } from '../utility/soft';
import EditProfileDialog from './EditProfileDialog';
import ProfileImage from './ProfileImage';

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
// Coffee button. The gear opens EditProfileDialog (name, phone, delete).
function ProfileData({ userData, commentCount }) {
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
        <Detail icon={<LocalCafeOutlined />} label='Membership'>
          {userData.bmcMember ? 'Active' : 'Inactive'}
        </Detail>
        <Detail icon={<EventOutlined />} label='Joined'>
          {dayjs(userData.created_at).format('MMM D, YYYY')}
        </Detail>
      </Box>

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
