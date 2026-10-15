'use client';

import Link from '@/components/utility/NextLink';
import { ChevronRightOutlined } from '@mui/icons-material';
import { Box, ButtonBase, Typography } from '@mui/material';

import { softPressSx, softRaised } from '@/components/utility/soft';
import StatusLabel from './StatusLabel';

// A card on the hub that opens one of the super admin's pages
// (docs/SUPER-ADMIN-HUB.md): an icon, its name, a line or two of what's there
// now, and, for a page that can need attention, its status as an icon and a
// word. The whole card is the link; it presses in while held.
export default function HubCard({ href, icon, title, lines = [], status, statusWord, index = 0 }) {
  return (
    <Box component='li' sx={{ display: 'flex' }}>
      <ButtonBase
        component={Link}
        href={href}
        className='enter'
        sx={[
          softRaised,
          softPressSx,
          {
            '--i': index,
            width: '100%',
            borderRadius: 4,
            p: 2.5,
            minHeight: '8rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            textAlign: 'left',
            gap: 1,
          },
        ]}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography sx={{ fontWeight: 700, flex: 1 }}>{title}</Typography>
          <ChevronRightOutlined sx={{ color: 'text.secondary' }} aria-hidden />
        </Box>
        {status && <StatusLabel status={status} word={statusWord} />}
        {lines.filter(Boolean).map((line) => (
          <Typography key={line} variant='body2' color='text.secondary'>
            {line}
          </Typography>
        ))}
      </ButtonBase>
    </Box>
  );
}
