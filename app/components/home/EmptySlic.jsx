'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  HubOutlined,
  LightbulbOutlined,
  SearchOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import { Box, Chip, Link as MuiLink, Paper, Typography } from '@mui/material';

import { readRecentLookups } from '@/utils/recentLookups';
import { BMC_URL } from '@/utils/variables';

import {
  softInset,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

// One of these shows per visit: small things drivers miss.
const TIPS = [
  'Tap the copy button beside an address to paste it into a text or another app.',
  'Tips from other drivers live under each SLIC. Add one when you learn something.',
  'Add SLICs to your home screen from the menu, and it opens like an app.',
  'On an iPhone, the arrow next to Navigate switches between Google and Apple Maps.',
];

// /home with no SLIC selected (UI-SUGGESTIONS.md #44): recent lookups as
// one-tap chips, a one-line tip, and support as a quiet last line. The first
// visit on a device has no recents, so it says how to start instead.
function EmptySlic({ user }) {
  const [recent, setRecent] = useState([]);
  const [tip, setTip] = useState(TIPS[0]);

  // Browser-only reads: the device's recent list and a random tip.
  useEffect(() => {
    setRecent(readRecentLookups());
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)]);
  }, []);

  const firstName = user?.name?.split(' ').at(0);

  return (
    <Paper
      variant='panel'
      sx={{ alignItems: 'stretch', gap: 3, viewTransitionName: 'slic-details' }}
    >
      {recent.length > 0 ? (
        <Box>
          <Typography
            variant='overline'
            component='h2'
            color='text.secondary'
            sx={{ display: 'block', mb: 1 }}
          >
            Recent lookups
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
            {recent.map((item) => (
              <Chip
                key={item.numSlic}
                component={Link}
                href={`/home?slic=${encodeURIComponent(item.numSlic)}`}
                clickable
                icon={
                  item.type === 'customer' ? (
                    <StorefrontOutlined />
                  ) : (
                    <HubOutlined />
                  )
                }
                label={item.label}
                aria-label={`Look up ${item.label} again`}
                sx={[
                  softRaisedSmall,
                  softPressSx,
                  {
                    height: '2.75rem',
                    borderRadius: 999,
                    px: 0.5,
                    fontWeight: 600,
                    color: 'primary.main',
                    '& .MuiChip-icon': { color: 'primary.main' },
                  },
                ]}
              />
            ))}
          </Box>
        </Box>
      ) : (
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={[
              softInset,
              {
                width: '4rem',
                height: '4rem',
                borderRadius: '50%',
                mx: 'auto',
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          >
            <SearchOutlined sx={{ color: 'primary.main', fontSize: '2rem' }} />
          </Box>
          <Typography variant='h5' component='h2' sx={{ fontWeight: 700 }}>
            Look up a SLIC
          </Typography>
          <Typography color='text.secondary' sx={{ mt: 1 }}>
            Search above by number, alpha code or customer name. Your recent
            lookups will show up here.
          </Typography>
        </Box>
      )}

      <Box
        sx={[
          softInset,
          { borderRadius: 4, p: 2, display: 'flex', alignItems: 'center', gap: 1.5 },
        ]}
      >
        <LightbulbOutlined sx={{ color: 'primary.main', flexShrink: 0 }} />
        <Typography variant='body2'>{tip}</Typography>
      </Box>

      <Typography variant='body2' color='text.secondary' sx={{ textAlign: 'center' }}>
        {user?.bmcMember ? (
          <>
            Thanks for supporting SLICs{firstName ? `, ${firstName}` : ''}.{' '}
            <MuiLink component={Link} href='/history'>
              Your lookup history
            </MuiLink>
          </>
        ) : (
          <>
            SLICs is free and runs on drivers&apos; support.{' '}
            <MuiLink href={BMC_URL} target='_blank' rel='noopener noreferrer'>
              Buy me a coffee
            </MuiLink>
          </>
        )}
      </Typography>
    </Paper>
  );
}

export default EmptySlic;
