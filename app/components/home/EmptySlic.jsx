'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowForwardRounded,
  HubOutlined,
  LightbulbOutlined,
  SearchOutlined,
  StorefrontOutlined,
} from '@mui/icons-material';
import {
  Box,
  Chip,
  IconButton,
  Link as MuiLink,
  Paper,
  Typography,
} from '@mui/material';

import { readRecentLookups } from '@/utils/recentLookups';
import { BMC_URL } from '@/utils/variables';

import {
  softInset,
  softPressSx,
  softRaisedSmall,
} from '../utility/soft';

// Small things drivers miss. Each visit shows the one after the last one this
// device showed, so they all come around; the arrow steps to the next.
const TIPS = [
  'Tap the copy button beside an address to paste it into a text or another app.',
  'Tips from other drivers live under each SLIC. Add one when you learn something.',
  'Search by city too, not just the SLIC number, code or customer name.',
  'Add SLICs to your home screen from the menu, and it opens like an app.',
  'A red number on the Tips button means new tips since you last looked.',
  'On an iPhone, the arrow next to Navigate switches between Google and Apple Maps.',
  'Not sure what to write? Tap a starter like Parking or Gate / guard and fill in the rest.',
  'Tap the thumbs-up on a tip that helped. The most useful tips rise to the top.',
  'Got something wrong in your tip? Tap the pencil on it to fix it.',
  'Driving at night? Turn on Dark mode in the menu.',
];

// Per-viewer convenience only: where this device is in the tips.
const TIP_STORAGE_KEY = 'slics-app-tip';

const readTipIndex = () => {
  try {
    const stored = Number.parseInt(localStorage.getItem(TIP_STORAGE_KEY), 10);
    return Number.isInteger(stored) ? stored : null;
  } catch {
    return null;
  }
};

const writeTipIndex = (index) => {
  try {
    localStorage.setItem(TIP_STORAGE_KEY, String(index));
  } catch {
    // Storage blocked (private mode etc.): the next visit starts over.
  }
};

// The tip after the one this device showed last.
const firstTipIndex = () => {
  const last = readTipIndex();
  return last === null ? 0 : (last + 1) % TIPS.length;
};

// /home with no SLIC selected (UI-SUGGESTIONS.md #44): recent lookups as
// one-tap chips, a one-line tip, and support as a quiet last line. The first
// visit on a device has no recents, so it says how to start instead.
function EmptySlic({ user }) {
  const [recent, setRecent] = useState([]);
  // /home renders this only in the browser (HydrationGuard), so the initial
  // state can read localStorage. Whatever is on screen is remembered as seen.
  const [tipIndex, setTipIndex] = useState(firstTipIndex);
  useEffect(() => {
    writeTipIndex(tipIndex);
  }, [tipIndex]);

  // Browser-only read: the device's recent list.
  useEffect(() => {
    setRecent(readRecentLookups());
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
          {
            borderRadius: 4,
            py: 1.5,
            pl: 2,
            pr: 1.5,
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
          },
        ]}
      >
        <LightbulbOutlined sx={{ color: 'primary.main', flexShrink: 0 }} />
        {/* A polite live region, so a tap on the arrow reads the new tip out.
            Its first tip is there from the start and isn't announced. Keyed by
            tip, so each new one fades up (`enter`, app/globals.css). */}
        <Box aria-live='polite' sx={{ flex: 1, minWidth: 0 }}>
          <Typography key={tipIndex} variant='body2' className='enter'>
            {TIPS[tipIndex]}
          </Typography>
        </Box>
        <IconButton
          onClick={() => setTipIndex((index) => (index + 1) % TIPS.length)}
          aria-label='Next tip'
          sx={[
            softRaisedSmall,
            softPressSx,
            {
              flexShrink: 0,
              width: '2.75rem',
              height: '2.75rem',
              color: 'primary.main',
            },
          ]}
        >
          <ArrowForwardRounded />
        </IconButton>
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
