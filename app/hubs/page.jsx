import { auth } from '@/auth';
import { Typography } from '@mui/material';

import { getAllHubs } from '@/lib/db/slics';

import RedirectMessage from '@/components/layout/RedirectMessage';
import SlicLookupPage from '@/components/slic/SlicLookupPage';

// The lookup screen with only the UPS hubs in its list. It was /all until
// 2026-10-08; next.config.mjs redirects old links here.
export default async function Hubs({ searchParams }) {
  const session = await auth();

  if (!session) {
    return (
      <RedirectMessage
        heading='You must be logged in to view SLICs.'
        redirect='/'
      />
    );
  }

  const hubs = await getAllHubs();

  return (
    <SlicLookupPage
      searchParams={searchParams}
      slics={hubs}
      user={session.user}
      heading={<Typography variant='sectionHeading'>All Hubs</Typography>}
    />
  );
}
