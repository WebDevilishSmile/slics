import { Link, Typography } from '@mui/material';
import { getSession } from '@/lib/authz';
import theme from '@/theme';
import { getPlaces } from '@/lib/db/places';
import { getAllSlics } from '@/lib/db/slics';
import PageContainer from '@/components/layout/PageContainer';
import PlaceFinder from '@/components/places/PlaceFinder';
import HydrationGuard from '@/components/utility/HydrationGuard';

export const metadata = {
  title: 'Places · SLICs',
};

// Places: driver-shared stops along routes — fuel, food, restrooms, rest
// areas — with a comment thread on each. It was "Whip It In & Out" at
// /whip-it-in-and-out until 2026-10-12 (next.config.mjs redirects the old
// path); the tagline keeps the phrase. Sign-in is enforced by middleware.js;
// the data lives in lib/db/places.js and the UI in components/places/.
export default async function PlacesPage() {
  const session = await getSession();
  const user = session?.user
    ? { id: session.user.id, role: session.user.role ?? 'user' }
    : null;

  const [places, slics] = await Promise.all([
    getPlaces(user?.id),
    getAllSlics(),
  ]);

  // Only what the SLIC pickers need — not every slic field.
  const slicOptions = slics
    .filter(({ numSlic }) => numSlic != null)
    .map(({ numSlic, alphaSlic, name }) => ({
      numSlic: String(numSlic),
      alphaSlic: alphaSlic || '',
      name: name || '',
    }));

  return (
    <PageContainer>
      <Typography variant='sectionHeading'>Places</Typography>
      <Typography
        variant='subtitle1'
        component='p'
        color='primary'
        sx={{ textAlign: 'center', fontWeight: 700, mt: 0.5, px: 2 }}
      >
        Whip it in and whip it out.
      </Typography>
      <Typography
        color='text.secondary'
        sx={{ maxWidth: theme.layout.width.prose, textAlign: 'center', mt: 2, px: 2 }}
      >
        Fuel, food, restrooms and places to rest that drivers have found along
        their runs. Add the spots you know and tell everyone how they went.{' '}
        {/* The /help guides for this page (components/help/guides.jsx). */}
        <Link href='/help#find-place'>How it works</Link>
      </Typography>
      {/* Client-only render: dates use the phone's time zone. */}
      <HydrationGuard>
        <PlaceFinder places={places} slics={slicOptions} user={user} />
      </HydrationGuard>
    </PageContainer>
  );
}
