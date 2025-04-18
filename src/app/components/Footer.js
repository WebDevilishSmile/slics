'use client';

import { Box } from '@mui/material';
import Image from 'next/image';
import theme from '../utilities/theme';

export default function Footer() {
  return (
    <Box /* FOOTER CONTAINER */
      sx={{
        width: '100%',
        height: '10rem',
        mt: 'auto',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.palette.primary.dark,
        gap: '1.5rem',
        p: '.5rem 0',
        transition: 'all .5s ease',
      }}
    >
      <Image
        src='/logo_3.png'
        height={180}
        width={180}
        alt='Tiago Davila Logo'
        style={{ filter: 'invert(1)' }}
      />
    </Box>
  );
}
