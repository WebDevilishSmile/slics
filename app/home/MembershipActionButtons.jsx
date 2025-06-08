// src/app/MembershipActionButtons.jsx (or src/app/components/MembershipActionButtons.jsx)
'use client'; // This is a Client Component

import {
  Box,
  Button,
  CardActions, // Only include what's needed here
  Typography,
} from '@mui/material';
import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function MembershipActionButtons({ isMember, isLoggedIn }) {
  const router = useRouter();

  const handleBecomeMember = async () => {
    await signOut({
      redirect: false,
    });
    // For external links, window.location.href is more reliable
    window.location.href =
      'https://www.buymeacoffee.com/tiagodavila/membership';
    // If you used router.push here for an external link, it would also work but window.location.href is explicit.
  };

  return (
    <CardActions
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '2rem',
        px: '2rem',
        pb: '2rem',
      }}
    >
      {!isMember && isLoggedIn && (
        <Box
          sx={{
            width: '100%',
            maxWidth: '30rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '.25rem',
          }}
        >
          <Button variant='contained' onClick={handleBecomeMember}>
            Become a Member
          </Button>
          <Typography sx={{ mt: 2 }}>
            After subscribing on Buy Me a Coffee, come back here and{' '}
            <strong>sign in</strong> to access your dashboard.
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          width: '100%',
          maxWidth: '30rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '.25rem',
        }}
      >
        {!isLoggedIn && (
          <>
            <Typography variant='body2'>
              Sign in or create an account.
            </Typography>
            <Button href='/signin' variant='contained'>
              Sign In
            </Button>
          </>
        )}
      </Box>
    </CardActions>
  );
}
