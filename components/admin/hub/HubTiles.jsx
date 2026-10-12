'use client';

import Link from 'next/link';
import { Box, ButtonBase, Typography } from '@mui/material';

import { softPressSx, softRaised } from '@/components/utility/soft';
import { formatCount } from './format';

// The hub's "At a glance" tiles (docs/SUPER-ADMIN-HUB.md stage B): a label,
// one number and a line of context each. A tile with somewhere to go is a
// link that presses in. Numbers are proportional, not tabular: they stand
// alone.
function Tile({ label, value, detail, href, index }) {
  const content = (
    <>
      <Typography variant='body2' color='text.secondary'>
        {label}
      </Typography>
      <Typography component='p' sx={{ typography: 'h4', fontWeight: 700, lineHeight: 1.15, my: 0.25 }}>
        {formatCount(value)}
      </Typography>
      {detail && (
        <Typography variant='body2' color='text.secondary'>
          {detail}
        </Typography>
      )}
    </>
  );
  const sx = [
    softRaised,
    {
      '--i': index,
      borderRadius: 4,
      p: 2,
      minHeight: '7rem',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'flex-start',
      textAlign: 'left',
      width: '100%',
    },
  ];
  return (
    <Box component='li' sx={{ display: 'flex' }}>
      {href ? (
        <ButtonBase component={Link} href={href} className='enter' sx={[...sx, softPressSx]}>
          {content}
        </ButtonBase>
      ) : (
        <Box className='enter' sx={sx}>
          {content}
        </Box>
      )}
    </Box>
  );
}

export default function HubTiles({ numbers }) {
  const tiles = [
    {
      label: 'Lookups today',
      value: numbers.lookups.day,
      detail: `${formatCount(numbers.lookups.week)} this week · ${formatCount(numbers.lookups.month)} in 30 days`,
    },
    {
      label: 'Active drivers this week',
      value: numbers.activeWeek,
      detail: `${formatCount(numbers.activeMonth)} in 30 days`,
    },
    {
      label: 'Accounts',
      value: numbers.accounts,
      detail: `${formatCount(numbers.newAccounts)} new this week`,
      href: '/admin/users',
    },
    {
      label: 'Tips this week',
      value: numbers.tips.week,
      detail: `${formatCount(numbers.tips.month)} in 30 days`,
      href: '/admin/comments',
    },
    {
      label: 'Open SLIC reports',
      value: numbers.openReports,
      detail: numbers.openReports === 0 ? 'Nothing waiting' : 'Waiting for a fix',
      href: '/admin/reports',
    },
    {
      label: 'Driver claims',
      value: numbers.pendingClaims,
      detail: numbers.pendingClaims === 0 ? 'Nothing waiting' : 'Waiting for a decision',
      href: '/admin/driver-claims',
    },
    {
      label: 'Members',
      value: numbers.members,
      detail: 'Buy Me a Coffee',
      href: '/admin/super/supporters',
    },
    {
      label: 'SLICs',
      value: numbers.slics,
      detail: `${formatCount(numbers.pdfs)} with directions`,
      href: '/admin/slics',
    },
    {
      label: 'Places',
      value: numbers.places,
      detail: 'Added by drivers',
      href: '/places',
    },
  ];

  return (
    <Box
      component='ul'
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        display: 'grid',
        gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))', lg: 'repeat(5, minmax(0, 1fr))' },
        gap: { xs: 1.5, sm: 2 },
      }}
    >
      {tiles.map((tile, index) => (
        <Tile key={tile.label} index={index} {...tile} />
      ))}
    </Box>
  );
}
