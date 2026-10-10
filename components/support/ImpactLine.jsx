import { Typography } from '@mui/material';

import { getImpactNumbers } from '@/lib/impact';

const number = (value) => new Intl.NumberFormat('en-US').format(value);

// "In the last 30 days, drivers looked up 2,482 SLICs and shared 12 tips."
// Shows what the app does without asking for anything (docs/BMC-SUPPORT.md
// stage 4). Renders nothing if the numbers can't be read, or are too small to
// mean much.
export default async function ImpactLine({ sx }) {
  let impact;
  try {
    impact = await getImpactNumbers();
  } catch (error) {
    console.error('Error loading impact numbers:', error);
    return null;
  }
  if (!impact || impact.lookups < 50) return null;

  return (
    <Typography variant='body2' color='text.secondary' sx={[{ textAlign: 'center' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      In the last {impact.days} days, drivers looked up{' '}
      <Typography component='strong' variant='inherit' sx={{ fontWeight: 700, color: 'primary.main' }}>
        {number(impact.lookups)} SLICs
      </Typography>
      {impact.tips > 0 && (
        <>
          {' '}and shared{' '}
          <Typography component='strong' variant='inherit' sx={{ fontWeight: 700, color: 'primary.main' }}>
            {number(impact.tips)} {impact.tips === 1 ? 'tip' : 'tips'}
          </Typography>
        </>
      )}
      .
    </Typography>
  );
}
