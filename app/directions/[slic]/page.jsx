import { Box, Paper, Typography } from '@mui/material';

import { getSession } from '@/lib/authz';
import { getSlicByNumSlic } from '@/lib/db/slics';
import { getRoute } from '@/lib/db/slicRoutes';
import { parseRoute, routeSourceLine, sectionLabel } from '@/lib/routeText';
import { formatPhoneNumber } from '@/lib/format';
import { MAP_ROUTE_NOTE } from '@/constants';

import PageContainer from '@/components/layout/PageContainer';
import RedirectMessage from '@/components/layout/RedirectMessage';
import PrintButton from '@/components/directions/PrintButton';
import RouteSteps from '@/components/directions/RouteSteps';

export const metadata = { title: 'Directions' };

// A SLIC's directions as a page to print or save as PDF (docs/SLIC-
// DIRECTIONS.md, stage 1). The header is the SLIC's live record, so a printout
// never carries an old address or phone the way the uploaded PDFs did. Every
// way is shown, one after another, then "Getting in". Opened from the
// directions sheet's Print button.
export default async function DirectionsPage({ params }) {
  const session = await getSession();
  if (!session) {
    return <RedirectMessage heading='You must be signed in to view directions.' redirect='/sign-in' />;
  }

  const { slic: numSlic } = await params;
  const [slic, route] = await Promise.all([
    getSlicByNumSlic(numSlic).catch(() => null),
    getRoute(numSlic).catch(() => null),
  ]);
  if (!slic) {
    return <RedirectMessage heading="That SLIC doesn't exist." redirect='/home' />;
  }

  const sections = route ? parseRoute(route.text) : [];
  const address = slic.address ?? {};
  const place = slic.name || slic.alphaSlic;

  return (
    <PageContainer>
      <Paper variant='panel' className='print-sheet' sx={{ alignItems: 'stretch', px: { xs: 2, sm: 4 }, gap: 3 }}>
        <Box component='header' sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
          <Typography variant='h4' component='h1' sx={{ fontWeight: 700 }}>
            {place}
          </Typography>
          <Typography variant='h6' component='p'>
            {slic.name ? `${slic.alphaSlic} · ${slic.numSlic}` : `SLIC ${slic.numSlic}`}
          </Typography>
          <Typography>
            {address.street}
            <br />
            {[address.city, address.state].filter(Boolean).join(', ')} {address.zip}
          </Typography>
          {slic.phone && <Typography>{formatPhoneNumber(slic.phone)}</Typography>}
        </Box>

        {sections.map((section, index) => (
          <Box component='section' key={`${sectionLabel(section)}-${index}`}>
            {(sections.length > 1 || section.title) && (
              <Typography variant='h6' component='h2' sx={{ mb: 1.5 }}>
                {sectionLabel(section)}
              </Typography>
            )}
            <RouteSteps section={section} />
          </Box>
        ))}

        {slic.arrival && (
          <Box component='section'>
            <Typography variant='h6' component='h2' sx={{ mb: 1 }}>
              Getting in
            </Typography>
            <Typography sx={{ whiteSpace: 'pre-line', lineHeight: 1.55 }}>{slic.arrival}</Typography>
          </Box>
        )}

        {!route && !slic.arrival && (
          <Typography color='text.secondary'>No directions for this SLIC yet.</Typography>
        )}

        <Box>
          {route && (
            <Typography variant='body2' color='text.secondary'>
              {routeSourceLine(route)}
            </Typography>
          )}
          <Typography variant='body2' color='text.secondary' sx={{ mt: 0.5 }}>
            {MAP_ROUTE_NOTE}
          </Typography>
        </Box>

        {(route || slic.arrival) && (
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <PrintButton />
          </Box>
        )}
      </Paper>
    </PageContainer>
  );
}
