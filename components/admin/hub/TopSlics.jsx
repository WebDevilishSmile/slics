'use client';

import Link from '@/components/utility/NextLink';
import { Box, Link as MuiLink, Typography } from '@mui/material';

import { softRaised } from '@/components/utility/soft';
import { formatCount } from './format';

// The SLICs looked up most in the last 30 days (docs/SUPER-ADMIN-HUB.md stage
// B). Ten long names read better as a ranked list than as a chart on a
// phone: each row has its number in text and a thin bar on a track of the
// same blue, so the size is never told by color or a tooltip alone.
export default function TopSlics({ slics }) {
  const max = Math.max(1, ...slics.map((slic) => slic.count));
  return (
    <Box
      component='section'
      aria-labelledby='usage-top-slics'
      sx={[softRaised, { m: 0, borderRadius: 4, p: { xs: 2, sm: 2.5 } }]}
    >
      <Typography id='usage-top-slics' component='h4' sx={{ fontWeight: 700 }}>
        Most looked-up SLICs
      </Typography>
      <Typography variant='body2' color='text.secondary' sx={{ mb: 1.5 }}>
        Last 30 days
      </Typography>
      {slics.length === 0 ? (
        <Typography variant='body2' color='text.secondary'>
          No lookups in the last 30 days.
        </Typography>
      ) : (
        <Box
          component='ol'
          sx={{
            listStyle: 'none',
            m: 0,
            p: 0,
            display: 'grid',
            gridTemplateColumns: { xs: 'minmax(0, 1fr)', md: 'repeat(2, minmax(0, 1fr))' },
            columnGap: 4,
            rowGap: 1.5,
          }}
        >
          {slics.map((slic, index) => (
            <Box component='li' key={slic.numSlic} sx={{ minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                <Typography
                  variant='body2'
                  color='text.secondary'
                  sx={{ width: '1.5rem', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}
                >
                  {index + 1}
                </Typography>
                <Typography variant='body2' sx={{ flex: 1, minWidth: 0 }} noWrap>
                  <MuiLink component={Link} href={`/home?slic=${encodeURIComponent(slic.numSlic)}`}>
                    {slic.numSlic}
                  </MuiLink>
                  {slic.name ? ` · ${slic.name}` : ''}
                </Typography>
                <Typography variant='body2' sx={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {formatCount(slic.count)}
                </Typography>
              </Box>
              <Box
                aria-hidden
                sx={{
                  ml: 5,
                  mt: 0.5,
                  height: '6px',
                  borderRadius: '3px',
                  backgroundColor: 'rgba(var(--mui-palette-primary-mainChannel) / 0.14)',
                }}
              >
                <Box
                  sx={{
                    width: `${(slic.count / max) * 100}%`,
                    height: '100%',
                    borderRadius: '3px',
                    backgroundColor: 'primary.main',
                  }}
                />
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
}
