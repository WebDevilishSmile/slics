'use client';

import { capitalizeFirstLetter } from '@/utils/functions';
import { MAX_WIDTH } from '@/utils/variables';
import { Edit } from '@mui/icons-material';
import { Alert, Box, IconButton, Snackbar, Typography } from '@mui/material';
import dayjs from 'dayjs';
import { useState } from 'react';
import AddEditPhone from './AddEditPhone';

function ProfileData({ userData }) {
  const [phone, setPhone] = useState(userData.phone || '');
  const [openSnack, setOpenSnack] = useState(false);
  const [snackMessage, setSnackMessage] = useState('Random error occurred');
  const [snackSeverity, setSnackSeverity] = useState('error');
  const [editPhone, setEditPhone] = useState(!userData.phone);

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
    <Box
      sx={{
        maxWidth: MAX_WIDTH,
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <Typography variant='h5' textAlign='center'>
        {userData.name}
      </Typography>
      <Typography textAlign='center'>{userData.email}</Typography>
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

      {!editPhone ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Typography>
            <strong>Phone:</strong> {userData.phone}
          </Typography>

          <IconButton
            sx={{ height: '2rem', width: '2rem' }}
            onClick={() => setEditPhone(!editPhone)}
          >
            <Edit sx={{ fontSize: '1.2rem' }} />
          </IconButton>
        </Box>
      ) : (
        <AddEditPhone
          phone={phone}
          setPhone={setPhone}
          showSnackbar={showSnackbar}
          userData={userData}
          setEditPhone={setEditPhone}
          editPhone={editPhone}
        />
      )}

      <Snackbar
        open={openSnack}
        onClose={handleCloseSnack}
        autoHideDuration={6000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity={snackSeverity} onClose={handleCloseSnack}>
          {snackMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default ProfileData;
