'use client';

import { Box } from '@mui/material';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import theme from '../utilities/theme';

export default function Login() {
  const supabase = createClientComponentClient();

  return (
    <Box /* HOME PAGE CONTAINER */
      id="home"
      sx={{
        width: '100vw',
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
        appearance={{ theme: ThemeSupa }}
        providers={['google', 'apple']}
        redirectTo="https://slics-fgvo74tht-webdevilishsmile.vercel.app/auth/callback"
      />
    </Box>
  );
}
