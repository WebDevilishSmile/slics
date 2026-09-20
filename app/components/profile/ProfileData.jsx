'use client';

import dayjs from 'dayjs';
import { useState } from 'react';

import { capitalizeFirstLetter } from '@/utils/functions';
import theme from '@/utils/theme';

import { Settings as SettingsIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  IconButton,
  Snackbar,
  Typography,
  Paper,
} from '@mui/material';
import Image from 'next/image';

import EditProfileDialog from './EditProfileDialog';

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
      sx={{
        maxWidth: theme.layout.width.panel,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 2,
        px: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant='h5' textAlign='center'>
          {userData.name}
        </Typography>

        <IconButton
          sx={{ height: '2rem', width: '2rem' }}
          onClick={() => setEditProfileOpen(true)}
          aria-label='Edit profile'
        >
          <SettingsIcon sx={{ fontSize: '1.2rem' }} />
        </IconButton>
      </Box>

      <Typography textAlign='center'>
        <strong>Email:</strong> {userData.email}
      </Typography>
      <Typography>
        <strong>Joined:</strong>{' '}
        {dayjs(userData.created_at).format('MMM D, YYYY')}
      </Typography>
      <Typography>
        <strong>Role:</strong> {capitalizeFirstLetter(userData.role)}
      </Typography>
      <Typography>
        <strong>Membership:</strong>{' '}
        {userData.bmcMember ? 'Active' : 'Inactive'}
      </Typography>

      {!userData.bmcMember && (
        <>
          <Button
            variant='contained'
            href='https://buymeacoffee.com/tiagodavila'
            target='_blank'
            rel='noopener noreferrer'
            sx={{ backgroundColor: '#f7f7f7', color: 'black', mt: 1 }}
          >
            <Image
              src='/bmc-brand-logo.svg'
              width={148}
              height={24}
              alt='Buy Me a Coffee'
            />
          </Button>
          <Typography variant='caption' sx={{ mb: 1 }}>
            Become a member
          </Typography>
        </>
      )}

      <Typography>
        <strong>Phone:</strong> {userData.phone || 'Not provided'}
      </Typography>

      <EditProfileDialog
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        userData={userData}
        commentCount={commentCount}
        showSnackbar={showSnackbar}
      />

      <Snackbar
        open={openSnack}
        onClose={handleCloseSnack}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}

export default ProfileData;
