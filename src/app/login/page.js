'use client';

import { Box } from '@mui/material';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import theme from '../utilities/theme';
import styles from './auth.module.css';

export default function Login() {
  const supabase = createClientComponentClient();

  return (
    <Box /* HOME PAGE CONTAINER */
      id="home"
      sx={{
        width: '100vw',
        height: '85vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        overflow: 'hidden',
        pt: '4rem',
        pb: '2rem',
        backgroundColor: theme.palette.background.light,
      }}
    >
      <Auth
        supabaseClient={supabase}
        appearance={{
          extend: false,
          className: {
            container: styles.authContainer,
            anchor: styles.authAnchor,
            button: styles.authButton,
          },
        }}
        providers={['google']}
        redirectTo={`${location.origin}/api/auth/callback`}
        onlyThirdPartyProviders
      />
    </Box>
  );
}
